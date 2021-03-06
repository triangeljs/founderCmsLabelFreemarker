const vscode = require('vscode'),
    fs = require('fs'),
    path = require('path'),
    cheerio = require('cheerio'),
    moment = require('moment'),
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
    userInfo = { UserCode: '', UserPassword: '', DocLibID: null, isLogin: false };

let output = (h_console, msg, clear = true) => {
    if (clear) {
        h_console.clear();
    }
    h_console.show(true);
    h_console.appendLine(msg);
};

let errTpl = () => `请先登录方正后在操作。`;

let loginTpl = data => `服务器名：${data.Title}
登录地址：${cmsURL}
用户名：${data.UserCode}
登录时间：${data.Time}
登录成功 O(∩_∩)O`;

let columnTpl = data => `站点名称：${data['站点名称']}
栏目ID：${data['栏目id']}
栏目名称：${data['栏目名称']}
栏目页URL_网站：${data['栏目页URL']}
模板组名_网站：${data['模板组名']}
模板名称_网站：${data['模板名称']}
模板id_网站：${data['模板id']}
发布规则名称_网站：${data['发布规则名称']}
栏目页URL_触屏：${data['触屏栏目页URL']}
模板名称_触屏：${data['触屏模板名称']}
模板id_触屏：${data['触屏模板id']}
发布规则名称_触屏：${data['触屏发布规则名称']}`;

let newsTpl = data => `文章ID：${data['文章ID']}
栏目：${data['栏目']}
文章模板组名_网站：${data['文章模板组名_网站']}
文章模板名_网站：${data['文章模板名_网站']}
文章模板ID_网站：${data['文章模板ID_网站']}
文章地址_网站：${data['文章地址']}
文章模板组名_触屏：${data['文章模板组名_触屏']}
文章模板名_触屏：${data['文章模板名_触屏']}
文章模板ID_触屏：${data['文章模板ID_触屏']}
文章地址_触屏：${data['文章触屏地址']}`;

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
    // 添加高级栏目列表属性
    vscode.commands.registerCommand('founder.advcolumnlistAttr', () => { advAttr('advcolumnlistAttr'); });
    // 添加当前位置属性
    vscode.commands.registerCommand('founder.positionAttr', () => { advAttr('position'); });
    // 添加手动区块稿件属性
    vscode.commands.registerCommand('founder.blockarticlelist', () => { advAttr('blockarticlelist'); });
    // --------
    // 登录方正
    vscode.commands.registerCommand('founder.login', () => {
        const settings = vscode.workspace.getConfiguration("founderCMS").get("loginInfo");
        let siteList = [];
        for (let i = 0; i < settings.length; i++) {
            let obj = {
                "label": settings[i].Title,
                "url": settings[i].url,
                "UserCode": settings[i].UserCode,
                "UserPassword": settings[i].UserPassword,
                "DocLibID": settings[i].DocLibID
            }
            siteList.push(obj);
        }
        vscode.window.showQuickPick(siteList, { 'placeHolder': '选择登录站点' }).then(selectValue => {
            if (!selectValue) {
                return false;
            }
            cmsURL = selectValue.url;
            userInfo.UserCode = selectValue.UserCode;
            userInfo.UserPassword = selectValue.UserPassword;
            userInfo.DocLibID = selectValue.DocLibID;
            userInfo.Title = selectValue.label;
            userInfo.Time = getNowFormatDate();
            request.post(cmsURL + '/xy/auth.do', { form: userInfo }, (error, resAuth) => {
                if (!error && resAuth.statusCode == 200 && resAuth.body != 'nouser') {
                    userInfo.isLogin = true;
                    getSiteInfo();
                    output(console_founder, loginTpl(userInfo));
                }
            });
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
                getColumnInfo()
                    .then(() => getTemplateInfo())
                    .then(() => getTemplateGroup())
                    .then(() => { output(console_founder, columnTpl(columnData)) });
            }
        });
    });
    // 查询文章信息
    vscode.commands.registerCommand('founder.newsQuery', function () {
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
    // 方正模板下载
    vscode.commands.registerCommand('founder.templateDownload', function () {
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

    // 方正模板上传
    vscode.commands.registerCommand('founder.templateUpload', function () {
        if (!userInfo.isLogin) {
            output(console_founder, errTpl());
            return false;
        }
        vscode.window.showInputBox({ 'prompt': '填写模板ID', 'value': '' }).then(selectValue => {
            if (selectValue) {
                UploadTemplate(selectValue);
            }
        });
    });

    // 方正栏目生成
    vscode.commands.registerCommand('founder.columnMake', function () {
        if (!userInfo.isLogin) {
            output(console_founder, errTpl());
            return false;
        }
        vscode.window.showInputBox({ 'prompt': '填写栏目ID', 'value': '' }).then(selectValue => {
            if (selectValue) {
                columnMake(selectValue);
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
        if (!selectValue) {
            return false;
        }
        let str = selectValue['description'];
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
        if (!selectValue) {
            return false;
        }
        let str = selectValue['description'];
        str = str.replace(/\{\{.+\}\}/, selectionText);
        editor.edit(editr => editr.replace(editor.selection, str));
    });
}

function editTag() {
    let editor = vscode.window.activeTextEditor,
        selection = editor.selection,
        selectionText = editor.document.getText(selection),
        founder = selectionText.match(/^'([^']*?)'\s*?:\s*[\[']?([^']*?)[\]']?$/),
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
                if (!selectValue) {
                    return false;
                }
                let str = selectValue['description'];
                str = selectionText.replace(/(:\s*[\[']?)([^']*?)([\]'])/, '$1' + str + '$3');
                editor.edit(editr => editr.replace(editor.selection, str));
            });
        } else {
            vscode.window.showInputBox({ 'prompt': name, 'value': founder[2] }).then(selectValue => {
                if (!selectValue) {
                    return false;
                }
                let str = selectValue;
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

//获取所有站点名称
function getSiteInfo() {
    return new Promise(function (resolve, reject) {
        request.get(cmsURL + '/xy/user/Site.do?DocLibID=1', function (error, res) {
            if (!error && res.statusCode == 200) {
                const json = JSON.parse(res.body);
                const len = json.length;
                for (let i = 0; i < len; i++) {
                    let key = json[i].key;
                    let val = json[i].value;
                    siteData[key] = val;
                }
                resolve('站点信息获取成功。');
            } else {
                reject(error);
            }
        });
    });
}

//以下为方正栏目查询方法
function getColumnInfo() {
    return new Promise(function (resolve, reject) {
        request.get(cmsURL + '/xy/article/columnDetails.do?ch=0&colID=' + colID, function (error, res) {
            if (!error && res.statusCode == 200) {
                var $ = cheerio.load(res.body);
                $('table tr').each(function (idx) {
                    var key = $(this).find('td').eq(0).text().trim().replace(/:/, "");
                    var val = $(this).find('td').eq(1).text().trim();
                    if (idx < 16 && key) {
                        columnData[key] = val;
                    } else if (key) {
                        columnData['触屏' + key] = val;
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
        request.get(cmsURL + '/e5workspace/manoeuvre/FormDocFetcher.do?FormID=0&DocLibID=' + userInfo.DocLibID + '&DocID=' + templateID, function (error, resTemplateInfo) {
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

// 方正文章查询
function getNewsInfo(id) {
    request.get(cmsURL + '/xy/article/View.do?DocLibID=1&DocIDs=' + id, function (error, res) {
        if (!error && res.statusCode == 200 && res.body != '') {
            const $ = cheerio.load(res.body);
            let data = {},
                patternTemplate = /^([^\-]*?)\-\-\-([\s\S]*?)\((\d+)\)$/,
                templateWebDataRaw = $('#pcShowDiv .paddingrow').eq(3).find('td').eq(0).text().trim(),
                templateMobileDataRaw = $('#pcShowDiv .paddingrow').eq(3).find('td').eq(1).text().trim(),
                templateWebInfo = '' == templateWebDataRaw ? false : templateWebDataRaw.match(patternTemplate),
                templateMobileInfo = '' == templateMobileDataRaw ? false : templateMobileDataRaw.match(patternTemplate);

            data['文章ID'] = id;
            data['栏目'] = $('#pcShowDiv .div-border-bottom .col-md-2').eq(2).find('.gray').eq(1).text().trim().replace(/~/g, ' > ');
            data['文章地址'] = $('#pcShowDiv .paddingrow').eq(2).find('td').eq(0).text().trim();
            data['文章触屏地址'] = $('#pcShowDiv .paddingrow').eq(2).find('td').eq(1).text().trim();

            data['文章模板组名_网站'] = templateWebInfo ? templateWebInfo[1].trim() : '';
            data['文章模板名_网站'] = templateWebInfo ? templateWebInfo[2].trim() : '';
            data['文章模板ID_网站'] = templateWebInfo ? templateWebInfo[3].trim() : '';

            data['文章模板组名_触屏'] = templateMobileInfo ? templateMobileInfo[1].trim() : '';
            data['文章模板名_触屏'] = templateMobileInfo ? templateMobileInfo[2].trim() : '';
            data['文章模板ID_触屏'] = templateMobileInfo ? templateMobileInfo[3].trim() : '';
            output(console_founder, newsTpl(data));
        } else {
            console_founder.appendLine('文章ID：' + id + '没有找到信息，请检查一下是否正确。');
        }
    });
}

//模板下载
function downloadTemplate(id) {
    request.get(cmsURL + '/e5workspace/manoeuvre/FormDocFetcher.do?FormID=0&DocLibID=' + userInfo.DocLibID + '&DocID=' + id, function (error, resTemplateInfo) {
        if (!error && resTemplateInfo.statusCode == 200 && resTemplateInfo.body != '') {
            let templateInfo = JSON.parse(resTemplateInfo.body),
                templateSrc = cmsURL + '/e5workspace/Data.do?action=download&path=' + encodeURIComponent(templateInfo.value.t_file),
                fileType = templateInfo.value.t_fileType,
                fileSiteID = templateInfo.value.t_siteID,
                download_path = path.join('C:/founderTemplet/' + '/' + siteData[fileSiteID] + '(' + fileSiteID + ')/' + id + '.' + fileType),
                curDate = moment().format('YYYY-MM-DD HH-mm-ss');

            fs.access(download_path, (err) => {
                if (!err) {
                    fs.renameSync(download_path, path.join('C:/founderTemplet/' + '/' + siteData[fileSiteID] + '(' + fileSiteID + ')/' + id + '_' + curDate + '.' + fileType));
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
                    console_founder.appendLine('模板ID：' + id + ' 下载完毕。' + getNowFormatDate());
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

//模板上传
function UploadTemplate(id) {
    let templateID = id,
        dataObj = {};
    request.get(cmsURL + '/e5workspace/manoeuvre/FormDocFetcher.do?FormID=0&DocLibID=' + userInfo.DocLibID + '&DocID=' + templateID, function (error, res) {
        if(error || res.body == '') {
            console_founder.appendLine('模板ID：' + id + ' 上传失败。' + getNowFormatDate());
            return;
        }
        let data = JSON.parse(res.body);
        dataObj = {
            "DocLibID": data.value["SYS_DOCLIBID"],
            "DocID": data.value["SYS_DOCUMENTID"],
            "FVID": data.value["SYS_FOLDERID"],
            "t_name": data.value["t_name"],
            "t_channel": data.value["t_channel"],
            "t_type": data.value["t_type"],
            "t_description": data.value["t_description"],
            "t_fileType": data.value["t_fileType"],
            "t_siteID": data.value["t_siteID"],
            "t_groupID": data.value["t_groupID"]
        }
        let formData = {
            t_file: fs.createReadStream(vscode.window.activeTextEditor.document.fileName)
        }
        request.post({ url: cmsURL + '/e5workspace/Data.do?action=upload&DocLibID=' + userInfo.DocLibID, formData: formData }, function (error, res, body) {
            if (error) {
                return console.error('upload failed:', error);
            }
            dataObj.t_file = body.replace(/^\s*\d+;/, '');
            request.post({ url: cmsURL + '/xy/template/FormSave.do', form: dataObj }, function (err) {
                if (err) {
                    return console.error('upload failed:', err);
                }
                console_founder.appendLine('模板ID：' + id + ' 上传成功。' + getNowFormatDate());
            })
        });
    });
}

//方正栏目生成
function columnMake(id) {
    let columnID = id;
    request.get(cmsURL + '/xy/article/pubColOperation.do?colID=' + columnID + '&pubContent=1', function (error, res) {
        if (error) {
            return console.error('upload failed:', error);
        }
        if(res.body == 'ok' && res.statusCode == 200) {
            console_founder.appendLine('栏目ID：' + id + ' 生成成功。' + getNowFormatDate());
        } else {
            console_founder.appendLine('栏目ID：' + id + ' 生成出现问题。' + getNowFormatDate());
        }
    });
}

//返回当前时间
function getNowFormatDate() {
    let date = new Date(),
        seperator1 = "-",
        seperator2 = ":",
        month = date.getMonth() + 1,
        strDate = date.getDate(),
        currentdate = '';
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + date.getSeconds();
    return currentdate;
}