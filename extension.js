var vscode = require('vscode');
var tag = [{
    label: '稿件列表',
    description: `<FOUNDER-XY type="articlelist" data="{'columnid':[],'articletype':'all','article_attr':'all','start':'','count':''}">{{ selectionText }}</FOUNDER-XY>`
}, {
    label: '分页稿件列表',
    description: `<FOUNDER-XY type="articlelistpage" data="{'columnid':[],'articletype':'all','article_attr':'all','page':'','count':''}">{{ selectionText }}</FOUNDER-XY>`
}, {
    label: '稿件内容',
    description: `<FOUNDER-XY type="article" data="{'articleid':''}">{{ selectionText }}</FOUNDER-XY>`
}, {
    label: '栏目列表',
    description: `<FOUNDER-XY type="columnlist" data="{'columnid':[],'columntype':'self'}">{{ selectionText }}</FOUNDER-XY>`
}, {
    label: '当前位置',
    description: `<FOUNDER-XY type="position" data="">{{ selectionText }}</FOUNDER-XY>`
}, {
    label: '手动区块稿件',
    description: `<FOUNDER-XY type="blockarticlelist" data="">{{ selectionText }}</FOUNDER-XY>`
}];
var tagAttr = [{
    label: '稿件列表',
    description: '<#list articles as article>{{ selectionText }}</#list>',
    category: ['articlelist', 'articlelistpage', 'blockarticlelist']
}, {
    label: '栏目名称',
    description: '${article.column}',
    category: ['articlelist', 'articlelistpage']
}, {
    label: '栏目ID',
    description: '${article.columnID?c}',
    category: ['articlelist', 'articlelistpage']
}, {
    label: '稿件序列号',
    description: '${article_index}',
    category: ['articlelist', 'articlelistpage', 'blockarticlelist']
}, {
    label: '稿件ID',
    description: '${article.id?c}',
    category: ['articlelist', 'articlelistpage', 'article', 'blockarticlelist']
}, {
    label: '链接标题',
    description: '${article.title}',
    category: ['articlelist', 'articlelistpage', 'article', 'blockarticlelist']
}, {
    label: '副题',
    description: '${article.subTitle}',
    category: ['articlelist', 'articlelistpage', 'article', 'blockarticlelist']
}, {
    label: '摘要',
    description: '${article.summary}',
    category: ['articlelist', 'articlelistpage', 'article', 'blockarticlelist']
}, {
    label: '作者',
    description: '${article.author}',
    category: ['articlelist', 'articlelistpage', 'article']
}, {
    label: '来源',
    description: '${article.source}',
    category: ['articlelist', 'articlelistpage', 'article']
}, {
    label: '关键字',
    description: '${article.keyword}',
    category: ['articlelist', 'articlelistpage', 'article']
}, {
    label: '编辑',
    description: '${article.editor}',
    category: ['articlelist', 'articlelistpage', 'article']
}, {
    label: '责任编辑',
    description: '${article.liability}',
    category: ['articlelist', 'articlelistpage', 'article']
}, {
    label: '正文',
    description: '${article.content}',
    category: ['articlelist', 'articlelistpage', 'article']
}, {
    label: '发布时间',
    description: '${article.pubTime?string\("yyyy-MM-dd HH:mm:ss"\)}',
    category: ['articlelist', 'articlelistpage', 'article', 'blockarticlelist']
}, {
    label: '文章链接',
    description: '${article.url}',
    category: ['articlelist', 'articlelistpage', 'article', 'blockarticlelist']
}, {
    label: '当前栏目链接',
    description: '${article. currentColUrl}',
    category: ['articlelist']
}, {
    label: '主栏目链接',
    description: '${article. masterColUrl}',
    category: ['articlelist']
}, {
    label: '标题图片(大)',
    description: '${article.picBig}',
    category: ['articlelist', 'articlelistpage', 'article', 'blockarticlelist']
}, {
    label: '标题图片(中)',
    description: '${article.picMiddle}',
    category: ['articlelist', 'articlelistpage', 'article', 'blockarticlelist']
}, {
    label: '标题图片(小)',
    description: '${article.picSmall}',
    category: ['articlelist', 'articlelistpage', 'article', 'blockarticlelist']
}, {
    label: '相关稿件循环',
    description: '<#list article.rels as rel>{{ selectionText }}</#list>',
    category: ['article']
}, {
    label: '相关稿件数量',
    description: '${article.rels?size}',
    category: ['article']
}, {
    label: '相关稿件序号',
    description: '${rel_index}',
    category: ['article']
}, {
    label: '相关稿件ID',
    description: '${rel.id?c}',
    category: ['article']
}, {
    label: '相关稿件标题',
    description: '${rel.title}',
    category: ['article']
}, {
    label: '相关稿件来源',
    description: '${rel.source}',
    category: ['article']
}, {
    label: '相关稿件发布时间',
    description: '${rel.pubTime?string("yyyy-MM-dd HH:mm:ss")}',
    category: ['article']
}, {
    label: '相关稿件文章链接',
    description: '${rel.url}',
    category: ['article']
}, {
    label: '相关稿件标题图片(大)',
    description: '${rel.picBig}',
    category: ['article']
}, {
    label: '相关稿件标题图片(中)',
    description: '${rel.picMiddle}',
    category: ['article']
}, {
    label: '相关稿件标题图片(小)',
    description: '${rel.picSmall}',
    category: ['article']
}, {
    label: '栏目列表',
    description: '<#list columns as column>{{ selectionText }}</#list>',
    category: ['columnlist']
}, {
    label: '栏目序号',
    description: '${column_index}',
    category: ['columnlist', 'position']
}, {
    label: '栏目ID',
    description: '${column.id?c}',
    category: ['columnlist', 'position']
}, {
    label: '栏目名称',
    description: '${column.name}',
    category: ['columnlist', 'position']
}, {
    label: '栏目关键词',
    description: '${column.keyword}',
    category: ['columnlist']
}, {
    label: '栏目描述',
    description: '${column.description}',
    category: ['columnlist']
}, {
    label: '栏目链接',
    description: '${column.url!}',
    category: ['columnlist', 'position']
}, {
    label: '当前位置',
    description: '<#list columns as column>{{ selectionText }}</#list>',
    category: ['position']
}];
var founderAttr = [{
    label: '全部',
    description: 'all',
    category: ['articletype', 'article_attr']
}, {
    label: '文章',
    description: 'article',
    category: ['articletype']
}, {
    label: '图片',
    description: 'pic',
    category: ['articletype']
}, {
    label: '视频',
    description: 'video',
    category: ['articletype']
}, {
    label: '专题',
    description: 'special',
    category: ['articletype']
}, {
    label: '链接',
    description: 'link',
    category: ['articletype']
}, {
    label: '多标题',
    description: 'multi',
    category: ['articletype']
}, {
    label: '一般新闻',
    description: 'COMMON',
    category: ['article_attr']
}, {
    label: '头条新闻',
    description: 'HEADLINE',
    category: ['article_attr']
}, {
    label: '图片新闻',
    description: 'PIC',
    category: ['article_attr']
}, {
    label: '当前栏目',
    description: 'self',
    category: ['columntype']
}, {
    label: '子栏目',
    description: 'son',
    category: ['columntype']
}, {
    label: '兄弟栏目',
    description: 'brother',
    category: ['columntype']
}];

function activate() {
    vscode.commands.registerCommand('founder.addTag', function () {
        //添加标签
        advTag();
    });
    vscode.commands.registerCommand('founder.editTag', function () {
        //编辑标签
        editTag();
    });
    vscode.commands.registerCommand('founder.articlelistAttr', function () {
        //添加稿件列表属性
        advAttr('articlelist');
    });
    vscode.commands.registerCommand('founder.articlelistpageAttr', function () {
        //添加分页稿件列表属性
        advAttr('articlelistpage');
    });
    vscode.commands.registerCommand('founder.articleAttr', function () {
        //添加稿件内容属性
        advAttr('article');
    });
    vscode.commands.registerCommand('founder.columnlistAttr', function () {
        //添加栏目列表属性
        advAttr('columnlist');
    });
    vscode.commands.registerCommand('founder.positionAttr', function () {
        //添加当前位置属性
        advAttr('position');
    });
    vscode.commands.registerCommand('founder.blockarticlelist', function () {
        //添加手动区块稿件属性
        advAttr('blockarticlelist');
    });
}
exports.activate = activate;

function advTag() {
    var editor = vscode.window.activeTextEditor,
        selection = editor.selection,
        selectionText = editor.document.getText(selection);
    vscode.window.showQuickPick(tag, { 'placeHolder': '选择方正标签' }).then(selectValue => {
        var str = selectValue ? selectValue['description'] : '';
        str = str.replace(/\{\{.+\}\}/, selectionText);
        editor.edit(editr => editr.replace(editor.selection, str));
    });
}

function advAttr(str) {
    var editor = vscode.window.activeTextEditor,
        selection = editor.selection,
        selectionText = editor.document.getText(selection),
        attr = getAttr(tagAttr, str);
    vscode.window.showQuickPick(attr, { 'placeHolder': '选择稿件属性' }).then(selectValue => {
        var str = selectValue ? selectValue['description'] : '';
        str = str.replace(/\{\{.+\}\}/, selectionText);
        editor.edit(editr => editr.replace(editor.selection, str));
    });
}

function editTag() {
    var editor = vscode.window.activeTextEditor,
        selection = editor.selection,
        selectionText = editor.document.getText(selection),
        founder = selectionText.match(/^'([^']*?)':[\[']?([^']*?)[\]']?$/),
        attr = '',
        name = '',
        lock = true;
    if (founder) {
        attr = getAttr(founderAttr, founder[1]);
        if (founder[1] == 'articletype') {
            name = '选择稿件类型';
            lock = true;
        }
        if (founder[1] == 'article_attr') {
            name = '选择稿件属性';
            lock = true;
        }
        if (founder[1] == 'columntype') {
            name = '选择栏目类型';
            lock = true;
        }
        if (founder[1] == 'columnid') {
            name = '填写栏目ID号';
            lock = false;
        }
        if (founder[1] == 'start') {
            name = '填写起始位置';
            lock = false;
        }
        if (founder[1] == 'count') {
            name = '填写数量';
            lock = false;
        }
        if (founder[1] == 'page') {
            name = '填写页数';
            lock = false;
        }
        if (founder[1] == 'articleid') {
            name = '填写稿件ID号';
            lock = false;
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