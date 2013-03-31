(function () {
    function getColumnsForScaffolding(data) {
        if ((typeof data.length !== 'number') || data.length === 0) {
            return [];
        }
        var columns = [];
        for (var propertyName in data[0]) {
            columns.push({ headerText: propertyName, rowText: propertyName, visible: true, bound: true, sortable: true });
        }
        return columns;
    }

    function checkColumns(data) {
        if(Object.prototype.toString.call( data ) !== '[object Array]' ) return undefined;
        for (var d in data) {
            var obj = data[d];
            if (obj.visible === undefined)
                    obj.visible = true;
            if (obj.bound === undefined)
                    obj.bound = true;
            if (obj.sortable === undefined)
                obj.sortable = true;
        }
        return data;
    }

    ko.simpleGrid = {
        // Defines a view model class you can use to populate a grid
        viewModel: function (configuration) {
            if (configuration === undefined) return;
            var me = this;

            me.data = configuration.data;
            me.currentPageIndex = ko.observable(0);
            me.pageSize = configuration.pageSize || 5;
            me.sortOrder = 1;
            me.pagerCount =  configuration.pagerCount || 5;
            me.startPage = ko.observable(1);

            // If you don't specify columns configuration, we'll use scaffolding
            me.columns = checkColumns(configuration.columns) || getColumnsForScaffolding(ko.utils.unwrapObservable(me.data));

            me.itemsOnCurrentPage = ko.computed(function () {
                var arr;
                var startIndex = this.pageSize * this.currentPageIndex();
                if (ko.isObservable(me.data)) {
                    arr = me.data.slice(startIndex, startIndex + this.pageSize);
                } else {
                    arr = [];
                }
                return arr;
            }, me);

            me.sortFunction = function (data) {
                var c = data.rowText;
                if (!data.sortable) return;
                if (me.sortOrder === 1)
                    me.data.sort(function (left, right) { return left[c] == right[c] ? 0 : (left[c] < right[c] ? -1 : 1) });
                else
                    me.data.sort(function (left, right) { return left[c] == right[c] ? 0 : (left[c] < right[c] ? 1 : -1) });

                me.sortOrder = (me.sortOrder === 1) ? 0 : 1;
            };

            me.maxPageIndex = ko.computed(function () {
                return  Math.ceil(ko.utils.unwrapObservable(me.data).length / me.pageSize) - 1;
            }, me);

            me.endPage = ko.computed(function () {
                if (((me.startPage() + me.pagerCount) - 1) > me.maxPageIndex() + 1)
                    return me.maxPageIndex() + 1;
                else
                    return (me.startPage() + me.pagerCount) - 1;
            }, me);

            me.showPagerRow= ko.computed(function () {
                return (me.pagerCount - 1) <= me.maxPageIndex();
            }, me);

            me.nextPage = function () {
                var n = me.startPage() + 1;
                var i = me.currentPageIndex() + 1;
                if (me.currentPageIndex() === me.maxPageIndex()) return;
                me.currentPageIndex(i);
                if (i === (me.endPage())){
                    me.startPage(n);
                }
            };

            me.prevPage = function () {
                var i = me.currentPageIndex() - 1;
                var n = me.startPage() - 1;
                if (me.currentPageIndex() === 0) return;
                me.currentPageIndex(i);
                if (i + 1 < me.startPage() && me.startPage() > 1 ){
                    me.startPage(n);
                }
            };
        }
    };

    // Templates used to render the grid
    var templateEngine = new ko.nativeTemplateEngine();

    templateEngine.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };

    templateEngine.addTemplate("ko_simpleGrid_grid", "\
                    <table class=\"kog\" cellspacing=\"0\">\
                        <thead>\
                            <tr data-bind=\"foreach: columns\">\
                               <th data-bind=\"visible: visible, text: headerText, click: $root.sortFunction.bind($data)\"></th>\
                            </tr>\
                        </thead>\
                        <tbody data-bind=\"foreach: itemsOnCurrentPage\">\
                           <tr data-bind=\"foreach: $parent.columns\">\
                                <!-- ko ifnot: bound -->\
                                    <td data-bind=\"visible: visible, html: content \"></td>\
                                <!-- /ko -->\
                                <!-- ko if: bound -->\
                                    <td data-bind=\"visible: visible, text: typeof rowText == 'function' ? rowText($parent) : $parent[rowText] \"></td>\
                                <!-- /ko -->\
                            </tr>\
                        </tbody>\
                    </table>");
    templateEngine.addTemplate("ko_simpleGrid_pageLinks", "\
                    <div class=\"ko-grid-pageLinks\">\
                        <!-- ko if: showPagerRow -->\
                            <a href=\"#\" data-bind=\"click: prevPage.bind(this), css: { selected: $data == $root.currentPageIndex()}\"><</a>\
                        <!-- /ko -->\
                        <!-- ko foreach: ko.utils.range(startPage(), endPage()) -->\
                               <a href=\"#\" data-bind=\"text: $data, click: function() { $root.currentPageIndex($data - 1) }, css: { selected: $data == $root.currentPageIndex() + 1 }\">\
                            </a>\
                        <!-- /ko -->\
                        <!-- ko if: showPagerRow -->\
                            <a href=\"#\" data-bind=\"click: nextPage.bind(this), css: { selected: $data == $root.currentPageIndex()}\">></a>\
                        <!-- /ko -->\
                    </div>");

    // The "simpleGrid" binding
    ko.bindingHandlers.simpleGrid = {
        init: function () {
            return { 'controlsDescendantBindings': true };
        },
        // This method is called to initialize the node, and will also be called again if you change what the grid is bound to
        update: function (element, viewModelAccessor, allBindingsAccessor) {
            var viewModel = viewModelAccessor(), allBindings = allBindingsAccessor();

            // Empty the element
            while (element.firstChild)
                ko.removeNode(element.firstChild);

            // Allow the default templates to be overridden
            var gridTemplateName = allBindings.simpleGridTemplate || "ko_simpleGrid_grid",
                pageLinksTemplateName = allBindings.simpleGridPagerTemplate || "ko_simpleGrid_pageLinks";

            // Render the main grid
            var gridContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate(gridTemplateName, viewModel, { templateEngine: templateEngine }, gridContainer, "replaceNode");

            // Render the page links
            var pageLinksContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate(pageLinksTemplateName, viewModel, { templateEngine: templateEngine }, pageLinksContainer, "replaceNode");
        }
    };
})();
