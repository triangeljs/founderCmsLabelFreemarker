const vscode = require('vscode'),
    url = require('url'),
    fs = require('fs'),
    path = require('path'),
    cheerio = require('cheerio'),
    founderConfig = require('./founderConfig.json'),
    tag = founderConfig.tag,
    tagAttr = founderConfig.tagAttr,
    founderAttr = founderConfig.founderAttr,
    console_founder = vscode.window.createOutputChannel('方正提示信息');

let request = require('request'),
    cmsURL = '',
    siteID = 0,
    colID = 0,
    siteData = {},
    columnData = {},
    userInfo = { UserCode: '', UserPassword: '', isLogin: false };

let output = (h_console, msg, clear = true) => {
    if (clear) {
        h_console.clear();
    }
    h_console.show(true);
    h_console.appendLine(msg);
};

let errTpl = () => `
请先登录方正后在操作。
`;

let loginTpl = data => `
登录地址：${cmsURL}
用户名：${data.UserCode}
登录成功 O(∩_∩)O
`;

let columnTpl = data => `
站点名称：${data['站点名称']}
栏目ID：${data['栏目id']}
栏目名称：${data['栏目名称']}
栏目页URL：${data['栏目页URL']}
模板组名：${data['模板组名']}
模板id：${data['模板id']}
模板名称：${data['模板名称']}
发布规则名称：${data['发布规则名称']}
下载模板：${data['下载模板']}
`;

let newsTpl = data => `
文章ID：${data['文章ID']}
栏目：${data['栏目']}
文章模板名：${data['文章模板名']}
文章地址：${data['文章地址']}
`;

request = request.defaults({ jar: true });

function activate() {
    // 添加标签
    vscode.commands.registerCommand('founder.addTag', () => { advTag(); });
    // 编辑标签
    vscode.commands.registerCommand('founder.editTag', () => { editTag(); });
    // 添加稿件列表属性
    vscode.commands.registerCommand('founder.articlelistAttr', () => { advAttr('articlelist'); });
    // 添加分页稿件列表属性
    vscode.commands.registerCommand('founder.articlelistpageAttr', () => { advAttr('articlelistpage'); });
    // 添加稿件内容属性
    vscode.commands.registerCommand('founder.articleAttr', () => { advAttr('article'); });
    // 添加栏目列表属性
    vscode.commands.registerCommand('founder.columnlistAttr', () => { advAttr('columnlist'); });
    // 添加当前位置属性
    vscode.commands.registerCommand('founder.positionAttr', () => { advAttr('position'); });
    // 添加手动区块稿件属性
    vscode.commands.registerCommand('founder.blockarticlelist', () => { advAttr('blockarticlelist'); });
    // --------
    // 登录方正
    vscode.commands.registerCommand('founder.login', () => {
        vscode.window.showInputBox({ 'prompt': '填写登录信息(http://127.0.0.1/ username password)', 'value': '' }).then(selectValue => {
            let loginStr;
            if (selectValue) {
                loginStr = selectValue.split(' ');
                if (loginStr.length != 3) {
                    return false;
                }
                cmsURL = loginStr[0];
                userInfo.UserCode = loginStr[1];
                userInfo.UserPassword = loginStr[2];
                request.post(cmsURL + '/xy/auth.do', { form: userInfo }, (error, resAuth) => {
                    if (!error && resAuth.statusCode == 200 && resAuth.body != 'nouser') {
                        userInfo.isLogin = true;
                        siteID = resAuth.body.substring(7);
                        output(console_founder, loginTpl(userInfo));
                    }
                });
            }
        });
    });
    // 查询栏目信息
    vscode.commands.registerCommand('founder.columnQuery', () => {
        if (!userInfo.isLogin) {
            output(console_founder, errTpl());
            return false;
        }
        vscode.window.showInputBox({ 'prompt': '填写栏目ID', 'value': '' }).then(selectValue => {
            if (selectValue) {
                colID = selectValue;
                columnData = {};
                getSiteInfo()
                    .then(() => getColumnInfo())
                    .then(() => getTemplateInfo())
                    .then(() => getTemplateGroup())
                    .then(() => { output(console_founder, columnTpl(columnData)) });
            }
        });
    });

    vscode.commands.registerCommand('founder.newsQuery', function () {
        // 查询文章信息
        if (!userInfo.isLogin) {
            output(console_founder, errTpl());
            return false;
        }
        vscode.window.showInputBox({ 'prompt': '填写文章ID', 'value': '' }).then(selectValue => {
            if (selectValue) {
                getNewsInfo(selectValue);
            }
        });
    });

    vscode.commands.registerCommand('founder.templateDownload', function () {
        // 方正模板下载
        if (!userInfo.isLogin) {
            output(console_founder, errTpl());
            return false;
        }
        vscode.window.showInputBox({ 'prompt': '填写模板ID', 'value': '' }).then(selectValue => {
            if (selectValue) {
                downloadTemplate(selectValue);
            }
        });
    });
}

exports.activate = activate;

function advTag() {
    let editor = vscode.window.activeTextEditor,
        selection = editor.selection,
        selectionText = editor.document.getText(selection);
    vscode.window.showQuickPick(tag, { 'placeHolder': '选择方正标签' }).then(selectValue => {
        let str = selectValue ? selectValue['description'] : '';
        str = str.replace(/\{\{.+\}\}/, selectionText);
        editor.edit(editr => editr.replace(editor.selection, str));
    });
}

function advAttr(str) {
    let editor = vscode.window.activeTextEditor,
        selection = editor.selection,
        selectionText = editor.document.getText(selection),
        attr = getAttr(tagAttr, str);
    vscode.window.showQuickPick(attr, { 'placeHolder': '选择稿件属性' }).then(selectValue => {
        let str = selectValue ? selectValue['description'] : '';
        str = str.replace(/\{\{.+\}\}/, selectionText);
        editor.edit(editr => editr.replace(editor.selection, str));
    });
}

function editTag() {
    let editor = vscode.window.activeTextEditor,
        selection = editor.selection,
        selectionText = editor.document.getText(selection),
        founder = selectionText.match(/^'([^']*?)':[\[']?([^']*?)[\]']?$/),
        attr = '',
        name = '',
        lock = true,
        map = {
            'articletype': { name: '选择稿件类型', lock: true },
            'article_attr': { name: '选择稿件属性', lock: true },
            'columntype': { name: '选择栏目类型', lock: true },
            'columnid': { name: '填写栏目ID号', lock: false },
            'start': { name: '填写起始位置', lock: false },
            'count': { name: '填写数量', lock: false },
            'page': { name: '填写页数', lock: false },
            'articleid': { name: '填写稿件ID号', lock: false }
        };
    if (founder) {
        attr = getAttr(founderAttr, founder[1]);
        if (map[founder[1]]) {
            name = map[founder[1]].name;
            lock = map[founder[1]].lock
        }
        if (lock) {
            vscode.window.showQuickPick(attr, { 'placeHolder': name }).then(selectValue => {
                var str = selectValue ? selectValue['description'] : founder[2];
                str = selectionText.replace(/(:[\[']?)([^']*?)([\]'])/, '$1' + str + '$3');
                editor.edit(editr => editr.replace(editor.selection, str));
            });
        } else {
            vscode.window.showInputBox({ 'prompt': name, 'value': founder[2] }).then(selectValue => {
                var str = selectValue ? selectValue : founder[2];
                str = selectionText.replace(/(:[\[']?)([^']*?)([\]'])/, '$1' + str + '$3');
                editor.edit(editr => editr.replace(editor.selection, str));
            });
        }
    }
}

//获取属性
function getAttr(data, str) {
    var obj = [];
    for (var i = 0, len = data.length; i < len; i++) {
        var arr = data[i].category;
        for (var j = 0, n = arr.length; j < n; j++) {
            if (str == arr[j]) {
                obj.push(data[i]);
            }
        }
    }
    return obj;
}

//以下为方正栏目查询方法
function getSiteInfo() {
    return new Promise(function (resolve, reject) {
        request.get(cmsURL + '/xy/Entry.do?s=' + siteID, function (error, res) {
            if (!error && res.statusCode == 200) {
                var $ = cheerio.load(res.body);
                $('#hdSites option').each(function () {
                    var key = $(this).attr('value');
                    var val = $(this).text().trim();
                    siteData[key] = val;
                });
                resolve('站点信息获取成功。');
            } else {
                reject(error);
            }
        });
    });
}

function getColumnInfo() {
    return new Promise(function (resolve, reject) {
        request.get(cmsURL + '/xy/article/columnDetails.do?ch=0&colID=' + colID, function (error, res) {
            if (!error && res.statusCode == 200) {
                var $ = cheerio.load(res.body);
                $('table tr').each(function (idx) {
                    var key = $(this).find('td').eq(0).text().trim().replace(/:/, "");
                    var val = $(this).find('td').eq(1).text().trim();
                    if (idx < 13 && key) {
                        columnData[key] = val;
                    }
                });
                resolve('栏目获取成功。');
            } else {
                reject(error);
            }
        });
    });
}

function getTemplateInfo() {
    var templateID = columnData['模板id'];
    return new Promise(function (resolve, reject) {
        if (!templateID || '网页发布模板未配置' == templateID) {
            resolve('网页发布模板未配置');
            return false;
        }
        request.get(cmsURL + '/e5workspace/manoeuvre/FormDocFetcher.do?FormID=0&DocLibID=19&DocID=' + templateID, function (error, resTemplateInfo) {
            if (!error && resTemplateInfo.statusCode == 200) {
                var templateInfo = JSON.parse(resTemplateInfo.body);
                siteID = templateInfo.value.t_siteID;
                columnData['站点ID'] = templateInfo.value.t_siteID;
                columnData['站点名称'] = siteData[siteID];
                columnData['模板组ID'] = templateInfo.value.t_groupID;
                columnData['模板路径'] = templateInfo.value.t_file;
                columnData['下载模板'] = cmsURL + '/e5workspace/Data.do?action=download&path=' + templateInfo.value.t_file;
                resolve('模板信息获取成功。');
            } else {
                reject(error);
            }
        });
    });
}

function getTemplateGroup() {
    var templateGroupID = columnData['模板组ID'];
    return new Promise(function (resolve, reject) {
        if (!templateGroupID) {
            resolve('网页发布模板未配置');
            return false;
        }
        request.get(cmsURL + '/xy/MainGroup.do?t=pagetpl&siteID=' + siteID, function (error, resTemplateGroup) {
            if (!error && resTemplateGroup.statusCode == 200) {
                var $ = cheerio.load(resTemplateGroup.body);
                $('#groupUl li').each(function () {
                    var key = $(this).attr('groupid');
                    var val = $(this).text().trim();
                    if (key == templateGroupID) {
                        columnData['模板组名'] = val;
                    }
                });
                resolve('模板组获取成功。');
            } else {
                reject(error);
            }
        });
    });
}

//模板下载
function downloadTemplate(id) {
    request.get(cmsURL + '/e5workspace/manoeuvre/FormDocFetcher.do?FormID=0&DocLibID=19&DocID=' + id, function (error, resTemplateInfo) {
        if (!error && resTemplateInfo.statusCode == 200 && resTemplateInfo.body != '') {
            let templateInfo = JSON.parse(resTemplateInfo.body),
                templateSrc = cmsURL + '/e5workspace/Data.do?action=download&path=' + encodeURIComponent(templateInfo.value.t_file),
                fileType = templateInfo.value.t_fileType,
                fileSiteID = templateInfo.value.t_siteID,
                download_dir = url.parse(cmsURL),
                download_path = path.join('C:/founderTemplet/' + download_dir.hostname.replace(/\./img, '_') + '/' + fileSiteID + '/' + id + '.' + fileType);
            fs.access(download_path, (err) => {
                if (!err) {
                    fs.renameSync(download_path, path.join('C:/founderTemplet/' + download_dir.hostname.replace(/\./img, '_') + '/' + fileSiteID + '/' + id + '.' + (new Date()).getTime() + '.' + fileType));
                }
                let i, len, tmp_path, stream, buf = download_path.split(path.sep);

                for (i = 1, len = buf.length; i < len; i += 1) {
                    tmp_path = buf.slice(0, i).join(path.sep);
                    try {
                        fs.statSync(tmp_path);
                    } catch (e) {
                        fs.mkdirSync(tmp_path);
                    }
                }

                stream = request(templateSrc).pipe(fs.createWriteStream(download_path));
                stream.on('finish', function () {
                    console_founder.show(true);
                    console_founder.appendLine('模板ID：' + id + '下载完毕。');
                    vscode.workspace.openTextDocument(download_path).then(document => {
                        vscode.window.showTextDocument(document);
                    });
                });
            });
        } else {
            console_founder.appendLine('模板ID：' + id + '没有找到信息，请检查一下是否正确。');
        }
    });
}

// 方正文章查询
function getNewsInfo(id) {
    request.get(cmsURL + '/xy/article/View.do?DocLibID=1&DocIDs=' + id, function (error, res) {
        if (!error && res.statusCode == 200 && res.body != '') {
            const $ = cheerio.load(res.body);
            let data = {};
            data['文章ID'] = id;
            data['栏目'] = $('#pcShowDiv .div-border-bottom .col-md-2').eq(2).find('.gray').eq(1).text().trim().replace(/~/g, ' > ');
            data['文章地址'] = $('#pcShowDiv .paddingrow').eq(2).find('td').eq(0).text().trim();
            data['文章模板名'] = $('#pcShowDiv .paddingrow').eq(3).find('td').eq(0).text().trim().replace(/\s/g, "");

            output(console_founder, newsTpl(data));
        } else {
            console_founder.appendLine('文章ID：' + id + '没有找到信息，请检查一下是否正确。');
        }

    });
}