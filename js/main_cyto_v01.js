$(document).ready(function() {
    $("#radio").buttonset();
    $("#radio").find("label").unbind("mouseup");
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
    $("#json-edit").hide();
    boolCy = true;
    $("#btnJson").change(function() {
        if(boolCy) {
            $("#cy").hide();
            $('div.edge-edition').hide();
            $('div.node-edition').hide();
            cy.elements().unselect();
            boolCy = false;
            jsonCode = JSON.stringify(cy.elements().jsons(), undefined, 2);
            $("#json").html(syntaxHighlight(jsonCode));
            $("#json-edit").show();
        } else {
            $("#json-edit").hide();
            if(jsonCode != $("#json")[0].innerText) {
                cy.remove(cy.elements());
                cy.add(JSON.parse($("#json").text()));
            }
            $("#cy").show();
            cy.reset();
            boolCy = true;
        }
    })
});
$(document).on('click focusout', '#edge-type_combobox input.custom-combobox-input, ul.ui-autocomplete', function() { //keyup keydown
    $.each(cy.$('edge:selected'), function(k, v) {
        var newVal = $("#edge-type_combobox").children("input").val();
        v.data('type', newVal);
        if($(".edge-type option[value='" + $("#edge-type_combobox").children("input").val().toLowerCase() + "']").length == 0) {
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
                var option = $('option:selected')[2].id;
                console.log(v.data('resources')[option - 1]);
                $("#resval").val(v.data('resources')[option - 1].value);
            } catch(e) {;
            }
        } else if($("#dialog-property").dialog('isOpen')) {
            try {
                var option = $('option:selected')[1].id;
                console.log(v.data('properties')[option - 1]);
                $("#propval").val(v.data('properties')[option - 1].value);
            } catch(e) {;
            }
        }
    });
});
$(window).load(function() {
    $(".edge-type").combobox();
    $(".resource-list").combobox();
    $(".property-list").combobox();
});

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
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
var $cy = $("#cy"),
    boolCy = false,
    jsonCode = "";
jQuery.widget('ui.dialog', jQuery.extend({}, jQuery.ui.dialog.prototype, {
    _title: function(titleBar) {
        titleBar.html(this.options.title || '&#160;');
    }
}));
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
            this.input = $("<input>").appendTo(this.wrapper).val(value).attr("title", "").addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left").autocomplete({
                delay: 0,
                minLength: 0,
                source: $.proxy(this, "_source")
            }).tooltip({
                tooltipClass: "ui-state-highlight"
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
            $("<a>").attr("tabIndex", -1).attr("title", "Show All Items").tooltip().appendTo(this.wrapper).button({
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
$(function() {
    $("#tabs").tabs();
    //$(document).tooltip();
    $("#dialog-clear").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: 310,
        title: '<span class="ui-icon ui-icon-trash"></span> Clean all items?',
        hide: 'fade',
        show: 'fade',
        buttons: {
            "Clean": function() {
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
            "class": 'btnSaveProperty',
            title: "New property added",
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
                            //$.each(newOptions, function() {
                            $select.append($("<option selected/>").attr("value", enteredValue1).text(enteredValue1));
                            //});
                        }
                        UpdateList();
                        $(".property-list").combobox();
                        clickInNode(v);
                        //TODO: Exibe tooltip "Valor adicionado"
                    });
                } else {
                    // TODO exibe tooltip "valor já existente"
                }
            }
        }, {
            text: "Save",
            click: function() {
                var node = cy.$('node:selected');
                node.data('properties')[$('option:selected', this).index()].value = $("#propval").val();
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
            "class": 'btnSaveResource',
            title: "New resource added",
            click: function() {
                var enteredValue1 = $("#dialog-resource p.content input.custom-combobox-input").val(),
                    enteredValue2 = $("#resval").val(),
                    exists = false;
                $('.resource-list option').each(function() {
                    if(this.value == enteredValue1) {
                        exists = true;
                        return false;
                    }
                });
                if(!exists) {
                    // adiciona recurso
                    //
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
                        var optVals = []; //,
                        //newOptions = [];
                        $('.resource-list option').each(function() {
                            var that = $(this);
                            optVals.push({
                                "key": that.attr('value').toLowerCase(),
                                "value": that.attr('value')
                            });
                        });

                        function UpdateList() {
                            var $select = $(".resource-list").parent().html("<label for=\"resource-list\">Name: </label><select class=\"resource-list\" />").find(".resource-list");
                            $.each(optVals, function() {
                                $select.append($("<option />").attr("value", this.key).text(this.value));
                            });
                            //$.each(newOptions, function() {
                            $select.append($("<option selected/>").attr("value", enteredValue1).text(enteredValue1));
                            //});
                        }
                        UpdateList();
                        $(".resource-list").combobox();
                        clickInNode(v);
                        //TODO: Exibe tooltip "Valor adicionado"
                    });
                } else {
                    // TODO exibe tooltip "valor já existente"
                }
            }
        }, {
            text: "Save",
            click: function() {
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
$cy.cytoscapeEdgehandles({
    lineType: "straight",
    preview: true,
    handleSize: 12,
    handleColor: "orange",
    edgeType: function() {
        return "flat";
    },
    nodeParams: function() {
        return {
            classes: "intermediate"
        };
    },
    start: function(sourceNode) {
        //console.log("start(%o)", sourceNode);
    },
    complete: function(sourceNode, targetNodes, added) {
        //console.log("complete(%o, %o, %o)", sourceNode, targetNodes, added);
        console.log(added);
    },
    stop: function(sourceNode) {
        //console.log("stop(%o)", sourceNode);
    }
});
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
$('#btnAddEdge').click(function() {
    $('#cy').cytoscapeEdgehandles('enable');
});
$cy.cytoscape({
    minZoom: 0.1,
    maxZoom: 2.0,
    //zoomingEnabled: false,
    layout: {
        //name : "random",
        fit: false
    }, // works when "random"
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
    elements: {
        // nós
        "nodes": [],
        "edges": []
    },
    ready: function() {
        cy = this;
		cy.remove(cy.elements());
cy.add([{
    "data": {
      "id": "n0",
      "name": "n0",
      "description": "Ars Gratia Artis 0",
      "resources": [
        {
          "id": "1",
          "name": "URL",
          "value": "http://www.google.com"
        },
        {
          "id": "2",
          "name": "Description",
          "value": "The Google Home Page"
        }
      ],
      "properties": [
        {
          "id": "1",
          "name": "Color",
          "value": "Gray"
        },
        {
          "id": "2",
          "name": "Shape",
          "value": "Round"
        }
      ]
    },
    "position": {
      "x": 450,
      "y": 100
    },
    "group": "nodes",
    "removed": false,
    "selected": false,
    "selectable": true,
    "locked": false,
    "grabbed": false,
    "grabbable": true,
    "classes": ""
  },
  {
    "data": {
      "id": "n1",
      "name": "n1",
      "description": "Ars Gratia Artis 1",
      "properties": [],
      "resources": []
    },
    "position": {
      "x": 450,
      "y": 315
    },
    "group": "nodes",
    "removed": false,
    "selected": false,
    "selectable": true,
    "locked": false,
    "grabbed": false,
    "grabbable": true,
    "classes": ""
  },
  {
    "data": {
      "source": "n0",
      "id": "e0",
      "target": "n1",
      "type": "parent"
    },
    "position": {},
    "group": "edges",
    "removed": false,
    "selected": false,
    "selectable": true,
    "locked": false,
    "grabbed": false,
    "grabbable": true,
    "classes": ""
  },
  {
    "data": {
      "source": "n1",
      "id": "e1",
      "target": "n0",
      "type": "belong-to"
    },
    "position": {},
    "group": "edges",
    "removed": false,
    "selected": false,
    "selectable": true,
    "locked": false,
    "grabbed": false,
    "grabbable": true,
    "classes": ""
  }]);
        $('#cy').cytoscapeEdgehandles('disable');
        var nodeClicked = cy.on('tap', 'node', function(e) {
            clickInNode(e.cyTarget);
        });
        $.when.apply(this, nodeClicked).done(function() {
            var a = $('.node-name');
            var b = $('.node-description');
            var custom = a.add(b);
            $(custom).each(function() {
                //bindTo = function(elem, prop) {
                var $this = $(this);
                var elem = $this;
                //var node = cy.$('node:selected');
                elem.data('oldVal', elem.val());
                // Look for changes in the value
                elem.on("propertychange keyup input paste", function(event) {
                    // If value has changed...
                    if(elem.data('oldVal') != elem.val()) {
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
            var neighborhood = edge.neighborhood().add(edge.connectedNodes());
            //cy.elements().addClass('faded');
            //neighborhood.removeClass('faded');
            console.log("id obj clicado: " + this.data('id'));
            //console.log(this.data('name'));
            //console.log(this.data('type'));
            $('#edge-id').val(this.data('id'));
            $("div.edge-edition select").val(this.data('type'));
            $(".custom-combobox-input").val(this.data('type'));
            //$(".custom-combobox-input").on('change', function(e){
            //$(".custom-combobox-input").bind("propertychange click keyup input paste", function(event) {
            //							   var elem = $(this);
            //				console.log("edge " + e.cyTarget.data('id') + " recebeu tipo " + elem.val());
            //							   e.cyTarget.data('type', elem.val());
            //							   
            //							   });
        });
        $.when.apply(this, edgeClicked).done(function() {
            //var a = $('.custom-combobox-input');
            //var b = $(".edge-type");
            //var custom = a.add(b);
            $('.edge-type').each(function() {
                var $this = $(this);
                var elem = $this;
                elem.data('oldVal', elem.val());
                elem.on("propertychange click keyup input paste change", function(event) {
                    // If value has changed...
                    if(elem.data('oldVal') != elem.val()) {
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
                if($("input:radio[id=btnAddNode]")[0].checked) {
                    var idNum = cy.nodes().size(),
                        setID = idNum.toString(),
                        offset = $cy.offset(),
                        position = {
                            //x: e.originalEvent.pageX - offset.left,
                            //y: e.originalEvent.pageY - offset.top
                            x: e.cyPosition.x,
                            y: e.cyPosition.y
                        };
                    //console.log("e.cyTarget.position(\"x\"): " + e.cyTarget.position("x"));
                    //console.log("e.cyTarget.position(\"y\"): " + e.cyTarget.position("y"));
                    //console.log("e.originalEvent.pageX: " + e.originalEvent.pageX);
                    //console.log("offset.left: " + offset.left);
                    //console.log("e.originalEvent.pageY: " + e.originalEvent.pageY);
                    //console.log("offset.top: " + offset.top);
                    cy.add([{
                        group: "nodes",
                        data: {
                            "id": "n" + setID,
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
                    $("div.edge-edition").hide();
                    //cy.elements().removeClass('faded');
                }
            }
        });
    }
});

function clickInNode(node) {
    $('div.edge-edition').hide();
    $('div.node-edition').show();
    cy.elements().unselect();
    //* início do preenchimento dos dados do nó
    //var node = node;
    //cy.elements(this).select();
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
            if(sourceName == undefined) sourceName = source.data('id');
            if(targetName == undefined) targetName = target.data('id');
            selects3 += "<li class='ui-widget-content'><div class='li-left' style='text-align: center'>" + sourceName + "</div><div class='li-center' style='text-align: center'>" + v.data('type') + "</div><div class='li-right' style='text-align: center'>" + targetName + "</div></li>"
        });
    }
    //* insere os conteúdos preenchidos nos locais apropriados
    $('div#tabs-1 p.content').html("<ol id=\"sel-res\">" + selects1 + "</ol>");
    $('div#tabs-2 p.content').html("<ol id=\"sel-prop\">" + selects2 + "</ol>");
    $('div#tabs-3 p.content').html("<ol id=\"sel-edge\">" + selects3 + "</ol>");
    //* fim do preenchimento dos dados do nó
    $("#sel-res").selectable({
		autoRefresh: true
    });
    $("#sel-prop").selectable({
        autoRefresh: true
    });
    $("#sel-edge").selectable({
        autoRefresh: true
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
    $('div#dialog-resource p.content .resource-list').html(dialog1);
    $('div#dialog-property p.content .property-list').html(dialog2);
    node.select();
    //* após conclusão do evento "clicar no nó", começa a monitorar a caixa de texto "NOME" e "DESCRICAO", para atualização automática dos valores
};