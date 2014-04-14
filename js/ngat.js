dm_title = '',
dm_desc = '',
dm_createdate = null,
dm_updatedate = null,
dm_uuid = '';
$(document).ready(function() {
    if(isTouch()) {
        //se for dispositivo móvel, então remove os tooltips iniciais
        $('button').removeClass('tiphover');
        $('button').removeClass('tipclick');
        $('input').removeClass('tiphover');
        $('input').removeClass('tipclick');
        $('label').removeClass('tiphover');
        $('label').removeClass('tipclick');
    }
    //cria a barra de ferramentas e adiciona ícones aos botões
    $("#radio").buttonset();
    $("#btnSelect").button("option", "icons", {
        primary: 'ui-icon-arrow-4'
    });
    $("#btnAddNode").button("option", "icons", {
        primary: 'ui-icon-plusthick'
    });
    $("#btnAddEdge").button("option", "icons", {
        primary: 'ui-icon-arrow-1-e'
    });
    $("#btnClear").button("option", "icons", {
        primary: 'ui-icon-trash'
    });
    $("#btnJson").button("option", "icons", {
        primary: 'ui-icon-info'
    });
    $("#btnXml").button("option", "icons", {
        primary: 'ui-icon-carat-2-e-w'
    });
    //paineis de edição de código inicialmente escondidos
    $("#json-edit").hide();
    $("#xml-edit").hide();
    boolXml = false;
    boolJson = false;
    $("#btnJson").change(function() {
        if(!boolJson) {
            $("#btnXml").prop('checked', false);
            $("#btnXmlLabel").removeClass('ui-state-active');
            $("#cy").hide();
            $("#xml-edit").hide();
            $('div.edge-edition').hide();
            $('div.node-edition').hide();
            cy.elements().unselect();
            jsonCode = JSON.stringify(cy.elements().jsons(), undefined, 2);
			//Removendo o '[' inicial e ']' final da string. Apenas estética.
			jsonCode = jsonCode.substr(0, jsonCode.length-2).substr(2);
            $("#json").html(syntaxHighlight(jsonCode));
            $("#json-edit").show();
            boolCy = false;
            boolXml = false;
            boolJson = true;
        } else {
            $("#json-edit").hide();
            if(jsonCode != $("#json")[0].innerText) {
                updateTime();
                cy.remove(cy.elements());
                cy.add(JSON.parse("[" + $("#json").text() + "]"));
            }
            $("#cy").show();
            cy.reset();
            boolJson = false;
            boolXml = false;
            boolCy = true;
        }
    })
    $("#btnXml").change(function() {
        if(!boolXml) {
            $("#btnJson").prop('checked', false);
            $("#btnJsonLabel").removeClass('ui-state-active');
            $("#cy").hide();
            $("#json-edit").hide();
            $('div.edge-edition').hide();
            $('div.node-edition').hide();
            cy.elements().unselect();
            xmlCode = createXmlCode();
            //suprimindo o cabeçalho do documento XML
            xmlCode = xmlCode.replace('<?xml version="1.0" encoding="ISO-8859-1" ?>\n', '');
            //colorindo o texto XML
            $("#xml").html(syntaxHighlightXML(xmlCode));
            $("#xml-edit").show();
            boolCy = false;
            boolJson = false;
            boolXml = true;
        } else {
            $("#xml-edit").hide();
            $("#cy").show();
            cy.reset();
            boolJson = false;
            boolXml = false;
            boolCy = true;
        }
    })
});

function isTouch() { //esta função detecta se a NGAT está sendo exibida em um dispositivo touchscreen
    return('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
};
$(document).on('click focusout', '#edge-type_combobox input.custom-combobox-input, ul.ui-autocomplete', function() {
    $.each(cy.$('edge:selected'), function(k, v) {
        var newVal = $("#edge-type_combobox").children("input").val();
        v.data('type', newVal);
        if($(".edge-type option[value='" + $("#edge-type_combobox").children("input").val().toLowerCase() + "']").length == 0) {
            updateTime();
            var optVals = [],
                newOptions = [];
            $('.edge-type option').each(function() {
                var that = $(this);
                optVals.push({
                    "key": that.attr('value').toLowerCase(),
                    "value": that.attr('value')
                });
            });
            newOptions = [{
                "key": newVal.toLowerCase(),
                "value": newVal
            }];

            function UpdateList() {
                var $select = $(".edge-type").parent().html("<select class=\"edge-type\" />").find(".edge-type");
                $.each(optVals, function() {
                    $select.append($("<option />").attr("value", this.key).text(this.value));
                });
                $.each(newOptions, function() {
                    $select.append($("<option selected/>").attr("value", this.key).text(this.value));
                });
            }
            UpdateList();
            $(".edge-type").combobox();
        }
    });
});

$(document).on('click focusout', '#resource-list_combobox input.custom-combobox-input, #property-list_combobox input.custom-combobox-input, ul.ui-autocomplete', function() {
    $.each(cy.$('node:selected'), function(k, v) {
        if($("#dialog-resource").dialog('isOpen')) {
            try {
                var option = $('option:selected')[2].index;
                console.log(v.data('resources')[option]);
                $("#resval").val(v.data('resources')[option].value);
            } catch(e) {;
            }
        } else if($("#dialog-property").dialog('isOpen')) {
            try {
                var option = $('option:selected')[1].index;
                console.log(v.data('properties')[option]);
                $("#propval").val(v.data('properties')[option].value);
            } catch(e) {;
            }
        }
    });
});
/*
 * Funções a serem executadas após o carregamento da página
 */
$(window).load(function() {
    if(isTouch()) {
        $('#btnAddEdgeLabel').removeClass('tiphover');
        $('#btnAddEdgeLabel').addClass('tipclick');
        $('#btnAddEdgeLabel').prop('title', "Tap the source node with two fingers,<br />choose 'Connect' then tap the target node.");
    }
    $(".edge-type").combobox();
    $(".resource-list").combobox();
    $(".property-list").combobox();
    $("#resource-list_combobox input").addClass('tipnow');
    var targclick = $('[class~=tipclick]'),
        targhover = $('[class~=tiphover]'),
        targnow = $('[class~=tipnow]'),
        target = false,
        tooltip = false,
        title = false;
    targclick.on('MSGestureTap touchstart click', function() {
        target = $(this);
        tip = target.prop('title');
        tooltip = $('<div id="tooltip"></div>');
        if(!tip || tip == '') return false;
        target.removeProp('title');
        tooltip.css('opacity', 0).html(tip).appendTo('body');
        var init_tooltip = function() {
            if($(window).width() < tooltip.outerWidth() * 1.5) tooltip.css('max-width', $(window).width() / 2);
            else tooltip.css('max-width', 340);
            var pos_left = target.offset().left + (target.outerWidth() / 2) - (tooltip.outerWidth() / 2),
                pos_top = target.offset().top - tooltip.outerHeight() - 20;
            if(pos_left < 0) {
                pos_left = target.offset().left + target.outerWidth() / 2 - 20;
                tooltip.addClass('left');
            } else tooltip.removeClass('left');
            if(pos_left + tooltip.outerWidth() > $(window).width()) {
                pos_left = target.offset().left - tooltip.outerWidth() + target.outerWidth() / 2 + 20;
                tooltip.addClass('right');
            } else tooltip.removeClass('right');
            if(pos_top < 0) {
                var pos_top = target.offset().top + target.outerHeight();
                tooltip.addClass('top');
            } else tooltip.removeClass('top');
            tooltip.css({
                left: pos_left,
                top: pos_top
            }).animate({
                top: '+=10',
                opacity: 1
            }, 50);
        };
        init_tooltip();
        $(window).resize(init_tooltip);

        function remove_tooltip() {
            tooltip.animate({
                top: '-=10',
                opacity: 0
            }, 50, function() {
                $(this).remove();
            });
            target.prop('title', tip);
        };
        // faz tooltip sumir em 3 segundos
        setTimeout(function() {
            remove_tooltip();
        }, 3000);
        tooltip.on('click', remove_tooltip);
    });
    targhover.on('mouseenter', function() {
        target = $(this);
        tip = target.prop('title');
        tooltip = $('<div id="tooltip"></div>');
        if(!tip || tip == '') return false;
        target.removeProp('title');
        tooltip.css('opacity', 0).html(tip).appendTo('body');
        var init_tooltip = function() {
            if($(window).width() < tooltip.outerWidth() * 1.5) tooltip.css('max-width', $(window).width() / 2);
            else tooltip.css('max-width', 340);
            var pos_left = target.offset().left + (target.outerWidth() / 2) - (tooltip.outerWidth() / 2),
                pos_top = target.offset().top - tooltip.outerHeight() - 20;
            if(pos_left < 0) {
                pos_left = target.offset().left + target.outerWidth() / 2 - 20;
                tooltip.addClass('left');
            } else tooltip.removeClass('left');
            if(pos_left + tooltip.outerWidth() > $(window).width()) {
                pos_left = target.offset().left - tooltip.outerWidth() + target.outerWidth() / 2 + 20;
                tooltip.addClass('right');
            } else tooltip.removeClass('right');
            if(pos_top < 0) {
                var pos_top = target.offset().top + target.outerHeight();
                tooltip.addClass('top');
            } else tooltip.removeClass('top');
            tooltip.css({
                left: pos_left,
                top: pos_top
            }).animate({
                top: '+=10',
                opacity: 1
            }, 50);
        };
        init_tooltip();
        $(window).resize(init_tooltip);

        function remove_tooltip() {
            tooltip.animate({
                top: '-=10',
                opacity: 0
            }, 50, function() {
                $(this).remove();
            });
            target.prop('title', tip);
        };
        targhover.on('mouseleave', remove_tooltip);
        tooltip.on('click', remove_tooltip);
    });
    targnow.on('classChanged', function() {
        target = $(this);
        tip = target.prop('title');
        tooltip = $('<div id="tooltip"></div>');
        if(!tip || tip == '') return false;
        target.removeProp('title');
        tooltip.css('opacity', 0).html(tip).appendTo('body');
        var init_tooltip = function() {
            if($(window).width() < tooltip.outerWidth() * 1.5) tooltip.css('max-width', $(window).width() / 2);
            else tooltip.css('max-width', 340);
            var pos_left = target.offset().left + (target.outerWidth() / 2) - (tooltip.outerWidth() / 2),
                pos_top = target.offset().top - tooltip.outerHeight() - 20;
            if(pos_left < 0) {
                pos_left = target.offset().left + target.outerWidth() / 2 - 20;
                tooltip.addClass('left');
            } else tooltip.removeClass('left');
            if(pos_left + tooltip.outerWidth() > $(window).width()) {
                pos_left = target.offset().left - tooltip.outerWidth() + target.outerWidth() / 2 + 20;
                tooltip.addClass('right');
            } else tooltip.removeClass('right');
            if(pos_top < 0) {
                var pos_top = target.offset().top + target.outerHeight();
                tooltip.addClass('top');
            } else tooltip.removeClass('top');
            tooltip.css({
                left: pos_left,
                top: pos_top
            }).animate({
                top: '+=10',
                opacity: 1
            }, 50);
        };
        init_tooltip();
        $(window).resize(init_tooltip);

        function remove_tooltip() {
            tooltip.animate({
                top: '-=10',
                opacity: 0
            }, 50, function() {
                $(this).remove();
            });
            target.prop('title', tip);
        };
        setTimeout(function() {
            remove_tooltip();
        }, 3000);
    });
});
/*
 * Função geradora do código UUID dos elementos do DM
 */

function uuid() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return(c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid.toUpperCase();
}

function updateTime() {
    dm_updatedate = $.now();
}

function syntaxHighlight(code) {
    code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return code.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        var cls = 'number';
        if(/^"/.test(match)) {
            if(/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if(/true|false/.test(match)) {
            cls = 'boolean';
        } else if(/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function syntaxHighlightXML(code) {
    code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return code.replace(/&gt;(.*?)&lt;/g, function(match) {
        var cls = '';
        if(/[0-9]/.test(match)) {
            cls = 'number';
        } else if(/true|false/.test(match)) {
            cls = 'boolean';
        } else if(/null/.test(match)) {
            cls = 'null';
        } else cls = 'string';
        return '&gt;<span class="' + cls + '">' + match.replace(/&gt;|&lt;/g, '') + '</span>&lt;';
    });
}

function createXmlCode() {
    var xw = new XMLWriter();
    xw.formatting = 'indented'; //add indentation and newlines
    xw.indentChar = ' '; //indent with spaces
    xw.indentation = 4; //add 2 spaces per level
    xw.writeStartDocument();
    xw.writeStartElement('domainModel');
    xw.writeStartElement('model');
    xw.writeStartElement('header');
    xw.writeElementString('modeluuid', dm_uuid);
    xw.writeElementString('authoruuid', 'null');
    xw.writeElementString('authorname', 'null');
    xw.writeElementString('authorisation', 'readwrite');
    xw.writeElementString('creationtime', dm_createdate.toString());
    xw.writeElementString('updatetime', dm_updatedate.toString());
    xw.writeElementString('title', dm_title);
    xw.writeElementString('description', dm_desc);
    xw.writeEndElement();
    xw.writeStartElement('body');
    xw.writeStartElement('dm');
    xw.writeStartElement('vdex');
    $.each(cy.$('node'), function(k, v) {
        xw.writeStartElement('term');
        xw.writeElementString('termIdentifier', v.data('id'));
        xw.writeStartElement('caption');
        xw.writeStartElement('langstring');
        xw.writeString(v.data('name'));
        xw.writeAttributeString('language', 'pt-br');
        xw.writeEndElement();
        xw.writeEndElement();
        xw.writeStartElement('description');
        xw.writeStartElement('langstring');
        xw.writeString(v.data('description'));
        xw.writeAttributeString('language', 'pt-br');
        xw.writeEndElement();
        xw.writeEndElement();
        $.each(v.data('resources'), function(j, u) {
            xw.writeStartElement('mediaDescriptor');
            xw.writeElementString('mediaLocator', u.name);
            xw.writeStartElement('interpretationNote');
            xw.writeStartElement('langstring');
            xw.writeString(u.value);
            xw.writeAttributeString('language', 'pt-br');
            xw.writeEndElement();
            xw.writeEndElement();
            xw.writeEndElement();
        });
        xw.writeStartElement('metadata');
        xw.writeEndElement();
        xw.writeElementString('dmId', v.data('id'));
        xw.writeStartElement('entitity');
        xw.writeElementString('dmId', v.data('id'));
        xw.writeEndElement();
        xw.writeEndElement();
    });
    $.each(cy.$('edge'), function(k, v) {
        xw.writeStartElement('relationship');
        xw.writeElementString('sourceTerm', v.data('source'));
        xw.writeElementString('targetTerm', v.data('target'));
        xw.writeStartElement('relationshipType');
        xw.writeString(v.data('type'));
        xw.writeAttributeString('source', 'http://www.grapple.org/relations.xml');
        xw.writeEndElement();
        xw.writeStartElement('metadata');
        xw.writeEndElement();
        xw.writeEndElement();
    });
    xw.writeEndElement();
    xw.writeEndElement();
    xw.writeEndElement();
    xw.writeEndElement();
    xw.writeEndElement();
    xw.writeEndDocument();
    var output = xw.flush();
    xw.close();
    return output;
}
var $cy = $("#cy"),
    boolCy = false,
    jsonCode = "";
/*
 * Função que permite código HTML nos títulos das caixas de diálogo
 * Útil para adicionar ícones nas barras de título
 */
jQuery.widget('ui.dialog', jQuery.extend({}, jQuery.ui.dialog.prototype, {
    _title: function(titleBar) {
        titleBar.html(this.options.title || '&#160;');
    }
}));
/*
 * Função responsável pelas caixas de inserção de novas opções nos selects
 * (custom-combobox)
 */
(function($) {
    $.widget("custom.combobox", {
        _create: function() {
            this.wrapper = $("<span>").addClass("custom-combobox").insertAfter(this.element).attr('id', this.element[0].className + "_combobox");
            this.element.hide();
            this._createAutocomplete();
            this._createShowAllButton();
        },
        _createAutocomplete: function() {
            var selected = this.element.children(":selected"),
                value = selected.val() ? selected.text() : "";
            this.input = $("<input>").appendTo(this.wrapper).val(value).attr("title", "Click to edit").addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left").autocomplete({
                delay: 0,
                minLength: 0,
                source: $.proxy(this, "_source")
            });
            this._on(this.input, {
                autocompleteselect: function(event, ui) {
                    ui.item.option.selected = true;
                    this._trigger("select", event, {
                        item: ui.item.option
                    });
                },
                autocompletechange: "_removeIfInvalid"
            });
        },
        _createShowAllButton: function() {
            var input = this.input,
                wasOpen = false;
            $("<a>").attr("tabIndex", -1).attr("title", "Show All Items").addClass("tiphover").appendTo(this.wrapper).button({
                icons: {
                    primary: "ui-icon-triangle-1-s"
                },
                text: false
            }).removeClass("ui-corner-all").addClass("custom-combobox-toggle ui-corner-right").mousedown(function() {
                wasOpen = input.autocomplete("widget").is(":visible");
            }).click(function() {
                input.focus();
                // Close if already visible
                if(wasOpen) {
                    return;
                }
                // Pass empty string as value to search for, displaying all results
                input.autocomplete("search", "");
            });
        },
        _source: function(request, response) {
            var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
            response(this.element.children("option").map(function() {
                var text = $(this).text();
                if(this.value && (!request.term || matcher.test(text))) return {
                    label: text,
                    value: text,
                    option: this
                };
            }));
        },
        _removeIfInvalid: function(event, ui) {
            // Selected an item, nothing to do
            if(ui.item) {
                return;
            }
            // Search for a match (case-insensitive)
            var value = this.input.val(),
                valueLowerCase = value.toLowerCase(),
                valid = false;
            this.element.children("option").each(function() {
                if($(this).text().toLowerCase() === valueLowerCase) {
                    this.selected = valid = true;
                    return false;
                }
            });
            // Found a match, nothing to do
            if(valid) {
                return;
            }
        },
        _destroy: function() {
            this.wrapper.remove();
            this.element.show();
        }
    });
})(jQuery);
/*
 * Função que cria as caixas de diálogo...
 */
$(function() {
    $("#tabs").tabs(); //...e também as abas :)
    $("#dialog-newdm").dialog({
        dialogClass: 'no-close',
        autoOpen: true,
        resizable: false,
        modal: true,
        width: 400,
        title: '<span class="ui-icon ui-icon-document"></span> Create new Domain Model',
        hide: 'fade',
        show: 'fade',
        buttons: [{
            text: "Start editing",
            click: function() {
                dm_uuid = uuid();
                dm_createdate = $.now();
                updateTime();
                dm_title = $("#dmtitle").val();
                dm_desc = $("#dmdesc").val();
                $(this).dialog("close");
            }
        }]
    });
    $("#dialog-clear").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: 310,
        title: '<span class="ui-icon ui-icon-trash"></span> Clear all items?',
        hide: 'fade',
        show: 'fade',
        buttons: {
            "Clear": function() {
                updateTime();
                cy.remove(cy.elements());
                $(this).dialog("close");
            },
            "Cancel": function() {
                $(this).dialog("close");
            }
        }
    });
    $("#dialog-property").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: 400,
        title: '<span class="ui-icon ui-icon-gear"></span> Add property',
        hide: 'fade',
        show: 'fade',
        open: function() {
            var node = cy.$('node:selected');
            if($('option', this).length != 0) {
                $("#property-list_combobox input").val($('option:selected', this)[0].value);
                $("#propval").val(node.data('properties')[$('option:selected', this).index()].value);
            } else {
                $("#property-list_combobox input").val(null);
                $("#propval").val(null);
            }
        },
        buttons: [{
            text: "Add",
            id: "btnAddProperty",
            class: "tipclick",
            click: function() {
                var enteredValue1 = $("#dialog-property p.content input.custom-combobox-input").val(),
                    enteredValue2 = $("#propval").val(),
                    exists = false;
                $('.property-list option').each(function() {
                    if(this.value == enteredValue1) {
                        exists = true;
                        return false;
                    }
                });
                if(!exists) {
                    // adiciona propriedade
                    updateTime();
                    $.each(cy.$('node:selected'), function(k, v) {
                        var nextId;
                        if(v.data('properties').length == 0) nextId = 1;
                        else nextId = v.data('properties').length + 1;
                        var newVal = $("#property-list_combobox").children("input").val();
                    });
                    $.each(cy.$('node:selected'), function(k, v) {
                        var nextId;
                        if(v.data('properties').length == 0) nextId = 1;
                        else nextId = v.data('properties').length + 1;
                        console.log(v.data('properties'));
                        var newRes = {
                            "id": nextId,
                            "name": enteredValue1,
                            "value": enteredValue2
                        };
                        v.data('properties').push(newRes);
                        var optVals = [];
                        $('.property-list option').each(function() {
                            var that = $(this);
                            optVals.push({
                                "key": that.attr('value').toLowerCase(),
                                "value": that.attr('value')
                            });
                        });

                        function UpdateList() {
                            var $select = $(".property-list").parent().html("<label for=\"property-list\">Name: </label><select class=\"property-list\" />").find(".property-list");
                            $.each(optVals, function() {
                                $select.append($("<option />").attr("value", this.key).text(this.value));
                            });
                            $select.append($("<option selected/>").attr("value", enteredValue1).text(enteredValue1));
                        }
                        UpdateList();
                        $(".property-list").combobox();
                        clickInNode(v);
                    });
                    $('#btnAddProperty').prop('title', 'New property added');
                } else {
                    $('#btnAddProperty').prop('title', 'Property already exists');
                }
            }
        }, {
            text: 'Save',
            id: "btnSaveProp",
            class: "tipclick",
            title: "Value saved",
            click: function() {
                updateTime();
                var node = cy.$('node:selected');
                node.data('properties')[$('option:selected', this).index()].value = $("#propval").val();
                clickInNode(node);
            }
        }, {
            text: "Close",
            click: function() {
                var node = cy.$('node:selected');
                clickInNode(node);
                $(this).dialog("close");
            }
        }]
    });
    $("#dialog-resource").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: 400,
        title: '<span class="ui-icon ui-icon-link"></span> Add resource',
        hide: 'fade',
        show: 'fade',
        open: function() {
            var node = cy.$('node:selected');
            if($('option', this).length != 0) {
                $("#resource-list_combobox input").val($('option:selected', this)[0].value);
                $("#resval").val(node.data('resources')[$('option:selected', this).index()].value);
            } else {
                $("#resource-list_combobox input").val(null);
                $("#resval").val(null);
            }
        },
        buttons: [{
            text: "Add",
            class: "tipclick",
            id: "btnAddResource",
            click: function() {
                var enteredValue1 = $("#dialog-resource input.custom-combobox-input").val(),
                    enteredValue2 = $("#resval").val(),
                    exists = false;
                $('.resource-list option').each(function() {
                    if(this.value == enteredValue1) {
                        exists = true;
                        return false;
                    }
                });
                if($("#resource-list_combobox input").val().trim() == '') {
                    $("#resource-list_combobox input").prop('title', 'Resource name can not be null');
                    $("#resource-list_combobox input").trigger('classChanged');
                } else {
                    if(!exists) {
                        // adiciona recurso
                        updateTime();
                        $.each(cy.$('node:selected'), function(k, v) {
                            var nextId;
                            if(v.data('resources').length == 0) nextId = 1;
                            else nextId = v.data('resources').length + 1;
                            var newVal = $("#resource-list_combobox").children("input").val();
                        });
                        $.each(cy.$('node:selected'), function(k, v) {
                            var nextId;
                            if(v.data('resources').length == 0) nextId = 1;
                            else nextId = v.data('resources').length + 1;
                            console.log(v.data('resources'));
                            var newRes = {
                                "id": nextId,
                                "name": enteredValue1,
                                "value": enteredValue2
                            };
                            v.data('resources').push(newRes);
                            var optVals = [];
                            $('.resource-list option').each(function() {
                                var that = $(this);
                                optVals.push({
                                    "key": that.attr('value').toLowerCase(),
                                    "value": that.attr('value')
                                });
                            });

                            function UpdateList() {
                                var $select = $(".resource-list").parent().html("<select class=\"resource-list\" />").find(".resource-list");
                                $.each(optVals, function() {
                                    $select.append($("<option />").attr("value", this.key).text(this.value));
                                });
                                $select.append($("<option selected/>").attr("value", enteredValue1).text(enteredValue1));
                            }
                            UpdateList();
                            $(".resource-list").combobox();
                            clickInNode(v);
                        });
                        $('#btnAddResource').prop('title', 'New resource added');
                    } else {
                        $('#btnAddResource').prop('title', 'Resource already exists');
                    }
                }
            }
        }, {
            text: "Save",
            class: "tipclick",
            title: "Value saved",
            click: function() {
                updateTime();
                var node = cy.$('node:selected');
                node.data('resources')[$('option:selected', this).index()].value = $("#resval").val();
                clickInNode(node);
                //TODO exibe tooltip "valor salvo"
            }
        }, {
            text: "Close",
            click: function() {
                var node = cy.$('node:selected');
                clickInNode(node);
                $(this).dialog("close");
            }
        }]
    });
});
/*
 * Função que gerencia a criação de novas arestas (ou relacionamentos)
 */
$cy.cytoscapeEdgehandles({
    preview: true,
    handleSize: 12,
    handleColor: "#0094d6",
    lineType: "straight", // can be "straight" or "draw"
    edgeType: function(sourceNode, targetNode) {
        var eitherIsInteraction = sourceNode.data('interaction') || targetNode.data('interaction');
        var alreadyConnected = eitherIsInteraction && sourceNode.edgesWith(targetNode).size() !== 0;
        if(alreadyConnected) {
            return null; // => no edge to be added
        }
        return 'flat';
    },
    loopAllowed: function(node) {
        return false;
    },
    nodeParams: function(sourceNode, targetNode) {
        return {
            classes: 'edgehandlestemp'
        };
    },
    edgeParams: function(sourceNode, targetNode) {
        return {
            classes: 'edgehandlestemp'
        };
    },
    start: function(sourceNode) { // fired when edgehandles interaction starts (drag on handle)
    },
    complete: function(sourceNode, targetNodes, addedEles) { // fired when edgehandles is done and entities are added
    },
    stop: function(sourceNode) { // fired when edgehandles interaction is stopped (either complete with added edges or incomplete)
    }
});
/*
 * Gerenciando as funções de cada botão da barra de ferramentas
 */
$('#btnClear').click(function() {
    $("#dialog-clear").dialog("open");
    $('#cy').cytoscapeEdgehandles('disable');
});
$('#btnAddRes').click(function() {
    $("#dialog-resource").dialog("open");
});
$('#btnAddProp').click(function() {
    $("#dialog-property").dialog("open");
});
$('#btnSelect').click(function() {
    $('#cy').cytoscapeEdgehandles('disable');
});
$('#btnAddNode').click(function() {
    $('#cy').cytoscapeEdgehandles('disable');
});
$('#btnAddEdgeLabel').click(function() {
    if(!isTouch()) $('#cy').cytoscapeEdgehandles('enable');
});
/*
 * Inicializando a biblioteca cytoscape.js
 */
$cy.cytoscape({
    minZoom: 0.1,
    maxZoom: 2.0,
    layout: {
        fit: false
    },
    style: cytoscape.stylesheet()
    // Set some js-dependent props
    .selector(".ui-cytoscape-edgehandles-source").css({
        "border-color": "#5CC2ED",
        "border-width": 3
    }).selector(".ui-cytoscape-edgehandles-target, node.ui-cytoscape-edgehandles-preview").css({
        "background-color": "#5CC2ED"
    }).selector("edge.ui-cytoscape-edgehandles-preview").css({
        "line-color": "#5CC2ED"
    }).selector("node.ui-cytoscape-edgehandles-preview, node.intermediate").css({
        "shape": "rectangle",
        "width": 15,
        "height": 15
    }).selector('node').css({
        'content': 'data(name)',
        'text-valign': 'center',
        'color': 'white',
        'text-outline-width': 2,
        'text-outline-color': '#888'
    }).selector('edge').css({
        'target-arrow-shape': 'triangle',
        'content': 'data(type)',
        'text-outline-color': '#FFFFFF',
        'text-outline-opacity': '1',
        'text-outline-width': 2,
        'text-valign': 'center',
        'color': '#777777',
        'width': '2px'
    }).selector(':selected').css({
        'background-color': 'black',
        'line-color': 'black',
        'target-arrow-color': 'black',
        'source-arrow-color': 'black',
        'color': 'black'
    }).selector('.faded').css({
        'opacity': 0.25,
        'text-opacity': 0
    }),
    ready: function() {
        cy = this;
        $('#cy').cytoscapeEdgehandles('disable');
        var nodeClicked = cy.on('tap', 'node', function(e) {
            clickInNode(e.cyTarget);
        });
        $.when.apply(this, nodeClicked).done(function() {
            var a = $('.node-name');
            var b = $('.node-description');
            var custom = a.add(b);
            $(custom).each(function() {
                var $this = $(this);
                var elem = $this;
                elem.data('oldVal', elem.val());
                // Look for changes in the value
                elem.on("propertychange keyup input paste", function(event) {
                    // If value has changed...
                    if(elem.data('oldVal') != elem.val()) {
                        updateTime();
                        elem.data('oldVal', elem.val());
                        $.each(cy.$('node:selected'), function(k, v) {
                            if($this[0] == $('.node-name')[0]) v.data('name', elem.val());
                            else v.data('description', elem.val());
                        });
                    }
                });
            });
        });
        var edgeClicked = cy.on('tap', 'edge', function(e) {
            $('div.node-edition').hide();
            $('div.edge-edition').show();
            var edge = e.cyTarget;
            //var neighborhood = edge.neighborhood().add(edge.connectedNodes());
            $("div.edge-edition select").val(this.data('type'));
            $(".custom-combobox-input").val(this.data('type'));
        });
        $.when.apply(this, edgeClicked).done(function() {
            $('.edge-type').each(function() {
                var $this = $(this);
                var elem = $this;
                elem.data('oldVal', elem.val());
                elem.on("propertychange click keyup input paste change", function(event) {
                    // If value has changed...
                    if(elem.data('oldVal') != elem.val()) {
                        updateTime();
                        elem.data('oldVal', elem.val());
                        $.each(cy.$('edge:selected'), function(k, v) {
                            v.data('type', elem.val());
                        });
                    }
                });
            });
        });
        cy.on('tap', function(e) {
            if(e.cyTarget === cy) {
                updateTime();
                if($("input:radio[id=btnAddNode]")[0].checked) {
                    var idNum = cy.nodes().size(),
                        //setID = idNum.toString(),
                        setID = uuid(),
                        offset = $cy.offset(),
                        position = {
                            x: e.cyRenderedPosition.x,
                            y: e.cyRenderedPosition.y
                        };
                    cy.add([{
                        group: "nodes",
                        data: {
                            "id": setID,
                            "resources": [],
                            "properties": []
                        },
                        renderedPosition: {
                            x: position.x,
                            y: position.y
                        },
                    }]);
                } else {
                    $('#form-name').val("");
                    $('#form-description').val("");
                    $('div.node-edition').hide();
                    $('div.edge-edition').hide();
                    cy.elements().unselect();
                }
            }
        });
        $('#cy').cytoscapeCxtmenu({
            menuRadius: 100,
            selector: 'node',
            commands: [{
                content: '<label>Connect</label>',
                select: function() {
					this.select();
                    $('#cy').cytoscapeEdgehandles('start', this.id());
                }
            }, {
                content: '<span class="icon-remove destructive-light"></span><label class="">Delete</label>',
                select: function() {
                    var node = cy.$("#" + this.id());
                    cy.remove(node);
                }
            }],
            activePadding: 20, // additional size in pixels for the active command            
            spotlightPadding: 4, // extra spacing in pixels between the node and the spotlight
            itemColor: 'white', // the colour of text in the command's content
            zIndex: 9999 // the z-index of the ui div
        });
        $('#cy').cytoscapeCxtmenu({
            menuRadius: 100,
            selector: 'edge',
            commands: [{
                content: '<label>Invert</label>',
                select: function() {
					this.select();
                    var edge = cy.$('edge:selected');
                    cy.remove(edge);
                    var target = edge.data('target');
                    var source = edge.data('source');
                    var newEdge = {
                        "data": {
                            "source": "" + edge.data('target') + "",
                            "uuid": "" + edge.data('uuid') + "",
                            "target": "" + edge.data('source') + "",
                            "type": "" + edge.data('type') + ""
                        },
                        "position": {},
                        "group": "edges",
                    }
                    var added = cy.add(newEdge);
                    cy.elements().unselect();
                    added.select();
                }
            }, {
                content: '<span class="icon-remove destructive-light"></span><label class="">Delete</label>',
                select: function() {
                    var edge = cy.$("#" + this.id());
                    cy.remove(edge);
                }
            }],
            activePadding: 30, // additional size in pixels for the active command            
            spotlightPadding: 0, // extra spacing in pixels between the node and the spotlight
            itemColor: 'white', // the colour of text in the command's content
            zIndex: 9999 // the z-index of the ui div
        });
    },
});
/*
 * Esta função gerencia as ações a serem tomadas quando um
 * conceito (nó) é clicado
 */

function clickInNode(node) {
    $('div.edge-edition').hide();
    $('div.node-edition').show();
    cy.elements().unselect();
    //* início do preenchimento dos dados do nó
    var properties = node.data('properties');
    var resources = node.data('resources');
    $('.node-name').val(node.data('name'));
    $('.node-description').val(node.data('description'));
    var selects1 = "",
        selects2 = "",
        selects3 = "",
        dialog1 = "",
        dialog2 = "";
    //* preenche a aba "RECURSOS"
    if(resources != undefined) {
        $.each(resources, function(k, v) {
            selects1 += "<li class='ui-widget-content' data-id='" + this.id + "'><div class='li-left'>" + this.name + "</div><div class='li-right'>" + this.value + "</div></li>"
        });
    }
    //* preenche a aba "PROPRIEDADES"
    if(properties != undefined) {
        $.each(properties, function(k, v) {
            selects2 += "<li class='ui-widget-content'><div class='li-left'>" + this.name + "</div><div class='li-right'>" + this.value + "</div></li>"
        });
    }
    //* preenche a aba "RELACIONAMENTOS"
    if(node.neighborhood('edge') != undefined) {
        $.each(node.neighborhood('edge'), function(k, v) {
            var source = cy.$('#' + v.data('source'));
            var target = cy.$('#' + v.data('target'));
            var sourceName = source.data('name');
            var targetName = target.data('name');
            if(sourceName == undefined) sourceName = '';
            if(targetName == undefined) targetName = '';
            selects3 += "<li class='ui-widget-content'><div class='li-left-rel' style='text-align: center'>" + sourceName + "</div><div class='li-center-rel' style='text-align: center'>" + v.data('type') + "</div><div class='li-right-rel' style='text-align: center'>" + targetName + "</div></li>"
        });
    }
    //* insere os conteúdos preenchidos nos locais apropriados
    $('div#tabs-1 p.content').html("<ol id=\"sel-res\">" + selects1 + "</ol>");
    $('div#tabs-2 p.content').html("<ol id=\"sel-prop\">" + selects2 + "</ol>");
    $('div#tabs-3 p.content').html("<ol id=\"sel-edge\">" + selects3 + "</ol>");
    //* fim do preenchimento dos dados do nó
    $("#sel-res").selectable({
        stop: function() {
            var result = $("#select-result").empty();
            $(".ui-selected", this).each(function() {
                var index = $(this).data('id');
                result.append(" " + index);
            });
        }
    });
    $("#sel-prop").selectable({
        autoRefresh: true,
        stop: function() {
            var result = $("#select-result").empty();
            $(".ui-selected", this).each(function() {
                var index = $("#sel-prop li").index(this);
                result.append(" #" + (index + 1));
            });
        }
    });
    $("#sel-edge").selectable({
        autoRefresh: true,
        stop: function() {
            var result = $("#select-result").empty();
            $(".ui-selected", this).each(function() {
                var index = $("#sel-edge li").index(this);
                result.append(" #" + (index + 1));
            });
        }
    });
    //* inicio da caixa de dialogo "RECURSOS"
    if(resources != undefined) {
        $.each(resources, function(k, v) {
            dialog1 += "<option value=\"" + this.name + "\" id=\"" + this.id + "\">" + this.name + "</option>"
        });
    }
    //* inicio da caixa de dialogo "PROPRIEDADES"
    if(properties != undefined) {
        $.each(properties, function(k, v) {
            dialog2 += "<option value=\"" + this.name + "\" id=\"" + this.id + "\">" + this.name + "</option>"
        });
    }
    $('div#dialog-resource .resource-list').html(dialog1);
    $('div#dialog-property .property-list').html(dialog2);
    node.select();
};