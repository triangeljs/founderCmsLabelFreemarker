# 方正翔宇 V5 内容管理系统Freemarker模板插件

## 插件说明
    方正翔宇 V5系统针对Visual Studio Code开发的一套集成模板标签编写、信息查询功能、信息生成、标签代码提示等功能。
    
    创建一个新的HTML文档，输入CIIC查看所有的标签。

## 插件配置
    1、打开Visual Studio Code设置。文件 > 首选项 > 设置。
    2、在窗口左边的默认设置里找到founderCMS选项，把选项里代码拷贝到右侧窗口里。
    3、title里填写站点名称、url里填写CMS域名、UserCode里填写用户名、UserPassword里填写密码、DocLibID里填写19或者24，市场方正填写19、中国网方正填写24。

## 标签代码

### ciic-t
触发器 | 描述
--- | ---
ciic-t:articlelist | 稿件列表
ciic-t:articlelistpage | 分页稿件列表
ciic-t:article | 稿件内容
ciic-t:columnlist | 栏目列表
ciic-t:advcolumnlist | 高级栏目列表
ciic-t:position | 当前位置
ciic-t:blockarticlelist | 手动区块稿件

### ciic-a
触发器 | 描述
--- | ---
ciic-a:article-list | 稿件循环
ciic-a:article-index | 稿件序列号
ciic-a:article-id | 稿件ID
ciic-a:article-title | 链接标题
ciic-a:article-subTitle | 副题
ciic-a:article-introTitle | 引题
ciic-a:article-summary | 摘要
ciic-a:article-author | 作者
ciic-a:article-editor | 编辑
ciic-a:article-liability | 责任编辑
ciic-a:article-source | 来源
ciic-a:article-keyword | 关键字
ciic-a:article-content | 正文
ciic-a:article-pubTime | 发布时间
ciic-a:article-url | 文章链接
ciic-a:article-urlPad | 文章触屏版链接
ciic-a:article-currentColUrl | 当前栏目链接
ciic-a:article-masterColUrl | 主栏目链接
ciic-a:article-picBig | 标题图片(大)
ciic-a:article-picMiddle | 标题图片(中)
ciic-a:article-picSmall | 标题图片(小)
ciic-a:article-columnName | 文章栏目名称
ciic-a:article-columnId | 文章栏目ID
ciic-a:article-columnUrl | 文章当前栏目链接
ciic-a:article-masterColumnUrl | 文章主栏目链接
ciic-a:column-list | 栏目循环
ciic-a:column-index | 栏目序号
ciic-a:column-name | 栏目名称
ciic-a:column-id | 栏目ID
ciic-a:column-keyword | 栏目关键词
ciic-a:column-description | 栏目描述
ciic-a:column-url | 栏目链接
ciic-a:column-urlPad | 栏目触屏链接
ciic-a:position-list | 当前位置循环