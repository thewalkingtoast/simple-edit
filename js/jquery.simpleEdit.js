/*
 * SimpleEdit 1.05, jQuery plugin
 *
 * Copyright© 2013, Adam Radabaugh
 *
 * Simple editing of values on basic HTML forms.
 * Licensed under the MIT License
 */
(function($){
	var settings = {},
		methods = (function methods(){
			var c = {},
				d = {},
				meclone = {},
				forms = {},
				containers = [],
				numContainers = 0,
				massEdit = false,
				editing = false,
				postReplace,
				useValidation,
				beforeFilter,
				afterFilter,
				beforeSave,
				afterSave,
				eventHandlerMarkup = function getEventHandler(){
					return $("<div>").addClass("simple-edit-single").html(
								'<span class="simple-edit-save"><span class="ui-icon ui-icon-check"></span></span>'
							+	'<span class="simple-edit-cancel"><span class="ui-icon ui-icon-closethick"></span></span>'
							+	'<div class="simple-edit-loader"></div>'
							+	'<div class="simple-edit-arrow-border"></div>'
							+	'<div class="simple-edit-arrow"></div>');
				},
				formHandlerMarkup = function getFormHandler(){
					return $("<div>").addClass("simple-edit-mass").html(
								'<span class="simple-edit-msave"><p>Save</p><span class="ui-icon ui-icon-check"></span></span>'
							+	'<span class="simple-edit-mcancel"><p>Cancel</p><span class="ui-icon ui-icon-closethick"></span></span>');
				};

			function clearState(){
				c = {};
				d = {};
				forms = {};
				containers = [];
				numContainers = 0;
				massEdit = false;
				editing = false;
				postReplace = undefined;
			}

			function getValue($ce, fieldName){
				var nval = "", ntext = "",
					$field = $ce.children(0);

				if ( useValidation ) {
					$field = $ce.children(0).children(0);
				}

				switch ( $ce.data("se-type") ) {
					case "select":
						nval = $field.children(0).val();
						ntext = d[fieldName].opts[nval];
					break;
					case "checkbox":
						if ( $field.children(0).is(":checked") ) {
							nval = "on";
							ntext = d[fieldName].opts.on;
						} else {
							nval = "";
							ntext = d[fieldName].opts.off;
						}
					break;
					case "radio":
						nval = $field.find("input:checked").val();
						ntext = d[fieldName].opts[nval];
					break;
					default:
						nval = $field.val();
						ntext = nval;
					break;
				}

				$ce = $field = null;

				return {
					nval: nval,
					ntext: ntext
				};
			}

			function mcancel(forceRevert){
				forceRevert = ( typeof forceRevert !== "boolean" ) ? true : forceRevert;

				if ( useValidation ) {
					$.each(forms, function(i, c){
						c.validationEngine("detach");
						c.validationEngine("hideAll");
					});
				}

				$.each(containers, function(i, c){
					c.trigger("restore", [forceRevert]);
				});

				clearState();
			}

			function msave(callback){
				var valid = true,
					postObj = {},
					asObj = {},
					ldata;

				function localCancel(){
					valid = postObj = asObj = ldata = null;
				}

				$.each(d, function(fieldName, fnobj){
					if ( useValidation ) {
						if ( forms[fieldName].validationEngine("validate") ) {
							if ( c.hasOwnProperty(fieldName) ) {
								postObj[fieldName] = fnobj.newValue;
								if ( !asObj.hasOwnProperty("fields") ) {
									asObj.fields = {};
								}
								asObj.fields[fieldName] = fnobj;
								ldata = d[fieldName].localData;
								if ( ldata != null ) {
									$.extend(postObj, ldata);
								}
							}
						} else {
							valid = false;
						}
					} else {
						postObj[fieldName] = fnobj.newValue;
						if ( !asObj.hasOwnProperty("fields") ) {
							asObj.fields = {};
						}
						asObj.fields[fieldName] = fnobj;
						ldata = d[fieldName].localData;
						if ( ldata != null ) {
							$.extend(postObj, ldata);
						}
					}
				});

				$.extend(postObj, settings.ajaxData);
				$.extend(asObj, settings.ajaxData);

				if ( valid && !$.isEmptyObject(postObj) ) {
					if ( typeof beforeSave === "function" ) {
						postObj = beforeSave(postObj);
					}

					if ( postObj ) {
						$.post(settings.saveUrl, postObj, function(response){
							if ( typeof response === "string" )
								resp = $.parseJSON(response);
							else
								resp = response;

							if ( !resp.success )
								mcancel(true);
							else
								mcancel(afterSave(undefined, asObj, response) !== false ? false : true);

							callback();
							localCancel();
						});
					} else {
						localCancel();
						mcancel();
					}
				} else {
					localCancel();
				}

				return valid;
			}

			function cancel($ce, $clone){
				$ce.replaceWith($clone);
			}

			function save($ce, $clone){
				var fieldName = $clone.data("se-name"),
					vals = {},
					dval = true,
					postObj = {},
					asObj = {},
					ldata = d[fieldName].localData;

				$ce
				.find("span.simple-edit-save, span.simple-edit-cancel").hide()
				.end()
				.find("div.simple-edit-loader").show();

				function localCancel(forceRevert) {
					forceRevert = ( typeof forceRevert !== "boolean" ) ? true : forceRevert;

					if ( !forceRevert ) {
						dval = afterFilter($clone, d[fieldName]);

						if ( dval !== false ) {
							if ( dval === "" ) {
								dval = settings.placeholderText;
								$clone.addClass(settings.placeholderClass);
							} else {
								$clone.removeClass(settings.placeholderClass);
							}

							$clone.html(dval);
						}
					}

					$ce
					.find("span.simple-edit-save, span.simple-edit-cancel").show()
					.end()
					.find("div.simple-edit-loader").hide();

					cancel($ce, $clone);
					clearState();

					$ce = $clone = fieldName = vals = dval = postObj = asObj = ldata = null;
				}

				vals = getValue($ce, fieldName);
				d[fieldName].newValue = vals.nval;
				d[fieldName].newText = vals.ntext;

				if ( vals.nval != null ) {
					postObj[fieldName] = vals.nval;
					asObj.fields = {};
					asObj.fields[fieldName] = d[fieldName];
				}

				if ( ldata != null ) {
					$.extend(postObj, ldata);
				}

				$.extend(postObj, settings.ajaxData);
				$.extend(asObj, settings.ajaxData);

				if ( !$.isEmptyObject(postObj) ) {
					if ( typeof beforeSave === "function" ) {
						postObj = beforeSave(postObj);
					}

					if ( postObj ) {
						$.post(settings.saveUrl, postObj, function(response){
							if ( typeof response === "string" )
								resp = $.parseJSON(response);
							else
								resp = response;

							if ( !resp.success )
								localCancel(true);
							else
								localCancel(afterSave($clone, asObj, response) !== false ? false : true);
						});
					} else {
						localCancel();
					}
				} else {
					localCancel();
				}
			}

			function getEditor(type, es){
				var ret,
					sel,
					checked,
					lobj,
					i = 0;

				switch (type) {
					case "text":
					case "password":
					case "email":
						return $("<input>").addClass(es[3]).attr({"id":es[0],"name":es[0],"type":type}).val(es[1]);
					case "select":
						ret = $("<select>").addClass(es[3]).attr({"id":es[0],"name":es[0]});
						sel = "";

						$.each(es[2], function(k, v){
							sel = ( v.toLowerCase() === es[1].toLowerCase() ) ? ' selected="selected"' : "";
							ret.append('<option value="' + k + '"' + sel + ">" + v + "</option>");
						});

						sel = checked = lobj = i = es = null;

						return $("<span>").addClass("se-field-container").html(ret);
					case "checkbox":
						checked = ( es[1].toLowerCase() === es[2].on.toLowerCase() ) ? true : false;
						lobj = $("<input>").addClass(es[3]).attr({"id":es[0],"type":"checkbox","name":es[0],"checked":checked});

						if ( checked ) {
							lobj[0].defaultChecked = true;
						}

						sel = checked = i = es = null;

						return $("<span>").addClass("se-field-container").html(lobj);
					case "radio":
						ret = $("<span>").addClass("se-field-container");

						$.each(es[2], function(k, v){
							checked = (v.toLowerCase() === es[1].toLowerCase() ? true : false);
							lobj = $("<input>")
									.addClass(es[3])
									.attr({
										"id" : es[0] + "" + ( i += 1 ),
										"type" : "radio",
										"name" : es[0],
										"value" : k,
										"checked" : checked
									});

							if ( checked ) {
								lobj[0].defaultChecked = true;
							}

							ret.append(lobj, v + "<br/>");
						});

						sel = checked = lobj = i = es = null;

						return ret;
					case "textarea":
						return $("<textarea>").addClass(es[3]).attr({"id":es[0],"name":es[0],"rows":3}).html(es[1]);
					case "datepicker":
                    case "autocomplete":
						postReplace = function(){
                            var elem = $("#"+es[0]), opts;

                            if (typeof es[2] === "object") {
                                opts = es[2];
                            } else if (typeof es[2] === "string") {
                                opts = eval('window["' + es[2].split(".").join('"]["') + '"]');
                            } else {
                                opts = {};
                            }

                            if (type === "datepicker") {
                                elem.datepicker(opts);
                            } else if (type === "autocomplete") {
                                elem.autocomplete(opts);
                            }
                        };
						return $("<input>").addClass(es[3]).attr({"id":es[0],"name":es[0],"type":"text"}).val(es[1]);
				}
			}

			function changeEvent($ce, $clone){
				var fieldName = $clone.data("se-name"),
					vals = {};

				vals = getValue($ce, fieldName);

				d[fieldName].newValue = vals.nval;
				d[fieldName].newText = vals.ntext;

				c[fieldName] = vals.nval;

				fieldName = vals = $ce = $clone = null;
			}

			function displayEditor($oe, $ne){
				numContainers += 1;
				var	$clone = $oe.clone(true, true),
					$ce = $("<div>").attr({
							  "id" : "editingContainer_" + numContainers,
							  "data-se-type" : $ne.data("elementType")
						  }).addClass("simple-edit-container"),
					fieldName = $clone.data("se-name"),
					lform;

				function localSave(){
					save($ce, $clone);
					if ( typeof lform === "object" ) {
						lform.validationEngine("detach");
					}
					$ce = $clone = lform = fieldName = null;
				}

				function localCancel(){
					cancel($ce, $clone);
					clearState();
					if ( typeof lform === "object" ) {
						lform.validationEngine("detach");
						lform.validationEngine("hideAll");
					}
					$ce = $clone = lform = fieldName = null;
				}

				function localValidation(){
					if ( lform.validationEngine("validate") ) {
						localSave();
					}
				}

				if ( useValidation ) {
					lform = $('<form>').html($ne);
					lform.validationEngine("attach", settings.validationEngineOptions);

					forms[fieldName] = lform;
					$ce.html(lform);
				} else {
					$ce.html($ne);
				}

				$ce.append(eventHandlerMarkup(), '<div class="simple-edit-clear"></div>');

				if ( massEdit ) {
					$ce.bind("restore", function(e, forceRevert){

						if ( !forceRevert ) {
							var dval = afterFilter($clone, d[fieldName]);

							if ( dval !== false ) {
								if ( dval === "" ) {
									dval = settings.placeholderText;
									$clone.addClass(settings.placeholderClass);
								} else {
									$clone.removeClass(settings.placeholderClass);
								}

								$clone.html(dval);
							}
						}

						$ce.replaceWith($clone);

						$ce = $clone = fieldName = null;
					}).delegate("input, select, textarea", "change", function(){
						changeEvent($ce, $clone);
					}).delegate("input, select, textarea", "keydown", function(e){
						var code = e.keyCode || e.charCode,
							target = e.currentTarget.tagName.toLowerCase();

						if ( target !== "textarea" && code === 13 || code === 27 ) {
							e.preventDefault();
							code = target = null;
							return false;
						} else {
							code = target = null;
							return true;
						}
					}).find(".simple-edit-single").hide();
				} else {
					$ce.delegate("span.simple-edit-save", "click", function(){
						if ( useValidation ) {
							localValidation();
						} else {
							localSave();
						}
					}).delegate("span.simple-edit-cancel", "click", function(){
						localCancel();
					}).delegate("input, select, textarea", "keydown", function(e){
						var code = e.keyCode || e.charCode,
							target = e.currentTarget.tagName.toLowerCase();

						if ( target !== "textarea" && code === 13 || code === 27 ) {
							e.preventDefault();

							if ( code === 13 ) {
								if ( useValidation ) {
									localValidation();
								} else {
									localSave();
								}
							} else {
								localCancel();
							}
						}

						code = target = null;
					});
				}

				containers.push($ce);

				$oe.replaceWith($ce);

				if ( typeof postReplace === "function" ) {
					postReplace();
				}

				if ( !massEdit ) {
					$ce.find("input, select, textarea").eq(0).focus();
				}

				$oe = $ne = null;
			}

			function editAll(e){
				e.preventDefault();

				var $eAT = $(settings.editAllTrigger),
					$fHM = formHandlerMarkup();

				massEdit = true;
				meclone = $eAT.clone(true, true);

				$eAT.replaceWith(
					$fHM.delegate("span.simple-edit-msave", "click", function(e){
						msave(function(){
							$fHM.replaceWith(meclone);
							$fHM = meclone = null;
						});
					}).delegate("span.simple-edit-mcancel", "click", function(e){
						mcancel();
						$fHM.replaceWith(meclone);
						$fHM = meclone = null;
					})
				);

				$eAT = null;

				$(settings.editClass).each(function(){
					$(this).trigger("dblclick");
				});

				return false;
			}

			function editSingle($e){
				if ( !massEdit && editing || !$e[0] ) { return false; }
				editing = true;

				var oc = $.trim(beforeFilter($e)),
					type = $e.data("se-type").toLowerCase(),
					opts = $e.data("se-opts"),
					ld = $e.data("se-ajax-data"),
					validation = $e.data("se-validation") || "",
					fieldName = $e.data("se-name"),
					editorSettings = [fieldName, oc, opts, validation],
					$editor,
					ov;

				if ( oc.toLowerCase() === settings.placeholderText.toLowerCase() ) {
					editorSettings[1] = oc = ov = "";
				} else if ( typeof opts === "object" ) {
					$.each(opts, function(i, opt){
						if ( opt === oc ) {
							ov = i;
							return false;
						}
					});
				} else {
					ov = oc;
				}

			    $editor = getEditor(type, editorSettings);
			    $editor.data("elementType", type);

			    displayEditor($e, $editor);

				d[fieldName] = {
					oldValue: ov,
					oldText: oc,
					newValue: ov,
					newText: oc,
					type: type,
					opts: opts,
					localData: ld
				};

			    fieldName = oc = ov = type = opts = $editor = editorSettings = ld = null;
			}

			function attachHandlers(forceClean){
				$(settings.editClass).each(function(){
					var $self = $(this);

					if ( $.trim(beforeFilter($self)) === "" ) {
						$self.addClass(settings.placeholderClass).html(settings.placeholderText);
					}
				});

				$('body').delegate(settings.editClass, "dblclick", function(){
					editSingle($(this));
				});

				if ( settings.editAllDefault && settings.editAllTrigger ) {
					settings.editAllDefault = false;
					$(settings.editAllTrigger).trigger("click");
				}

				if ( forceClean && !editing && !massEdit ) { clearState(); }
			}

			function init(options){
				if ( $.isEmptyObject(settings) ) {
					settings = $.extend({}, $.simpleEdit.defaults, options);

					if ( settings.useValidationEngine ) {
						if ( typeof $.fn.validationEngine !== "function" ) {
							console.error("jQuery.validationEngine does not exist.");
							settings.useValidationEngine = false;
						}
					}

					if ( settings.saveUrl === "" ) {
						console.error("No 'saveUrl' was provided for jQuery.simpleEdit.");
						return false;
					}

					useValidation = settings.useValidationEngine;
					beforeFilter = settings.beforeFilter;
					afterFilter = settings.afterFilter;
					beforeSave = settings.beforeSave;
					afterSave = settings.afterSave;

					if ( typeof settings.editAllTrigger === "string" && settings.editAllTrigger !== "" ) {
						$(settings.editAllTrigger).live("click", editAll);
					} else if ( settings.editAllDefault ) {
						console.error("editAllDefault was set to 'true' without valid editAllTrigger for jQuery.simpleEdit.");
						return false;
					}

					attachHandlers();
				}
			}

			function destroy(){
				$('body').undelegate(settings.editClass, "dblclick");
				$(settings.editAllTrigger).die("click", editAll);
				clearState();
			}

			return { "init" : init, "update" : attachHandlers, "destroy" : destroy };
		}());

	$.simpleEdit = function simpleEdit(method, value){
		if ( typeof method === "string" && methods[method] ) {
			// make sure init is called once
			if ( method !== "destroy" )
				methods.init();
			methods[method].call();
		} else if ( typeof method === "string" && settings[method] && value != null) {
			settings[method] = value;
		} else if ( typeof method === "string" && settings[method] && value == null) {
			return settings[method];
		} else if ( typeof method === "object" || !method ) {
			methods.init(method);
		} else {
			console.error("Method " + method + " does not exist in jQuery.simpleEdit.");
		}
	};

	$.simpleEdit.defaults = {
		/**
		* The URL simpleEdit will save form data to. Can be absolute or relative.
		* -This must be provided during intialization.-
		*
		*/
		saveUrl: window.location.href,

		/**
		* A jQuery selector <span>s that simpleEdit will respond to.
		*
		*/
		editClass: ".editable",

		/**
		* Whether the form should initialize in editAll mode or not.
		* editAll mode displays all editClass <span>s as editable.
		*
		*/
		editAllDefault: false,

		/**
		* A jQuery selector for the element (button, link, etc) that, when clicked,
		* will cause simpleEdit to enter editAll mode.
		*
		*/
		editAllTrigger: "",

		/**
		* Any additional data you wish simpleEdit to send to the server when it
		* is saving form data such as the current user ID.
		*
		* This option is meant for immutable data. It is meant for data that is
		* necessary to all save requests on the page but is not directly unique
		* to the field/value being saved. To do this, please see the
		* 'beforeSave' function below.
		*
		*/
		ajaxData: {},

		/**
		* This option allows you to provide your own function to modify the data
		* simpleEdit will send to the saveURL before it is sent.
		*
		* postObj is an object literal containing the se-name and value, plus any
		* data added to ajaxData.
		*
		* Modify the object as needed and simply return it.
		*
		*/
		beforeSave: function beforeSave(postObj){return postObj;},

		/**
		* This option allows you customize simpleEdit's behavior after
		* a successful save.
		*
		* The function arguments are as follows:
		*
		*	$element - A jQuery object representing the raw generated form element.
		*
		*	data - The POST data simpleEdit had previously sent to the saveURL,
		*			along with any data from the ajaxData option and any modifications
		*			from the beforeSave option.
		*
		*	response - The direct response from the saveURL. If the saveURL sent back
		*				any additional data in the response aside from the 'success'
		*				key, you will access to it here.
		*
		*/
		afterSave: function afterSave($element, data, response){},

		/**
		* This option allows you to change, or otherwise mutate, the value
		* of the form field that simpleEdit is retrieving after 'Save' is clicked,
		* and before it is sent to saveURL. For instance, on checkboxes, you may
		* wish to send back 1 or 0 instead of 'on' and ''.
		*
		* The function arguments are as follows:
		*
		*	$element - A jQuery object representing the raw generated form element.
		*
		*/
		beforeFilter: function beforeFilter($element){return $element.text();},

		/**
		* This option allows you to change, or otherwise mutate, the value
		* of the form field that simpleEdit will save back to the <span> after
		* a successful POST request to saveURL. For instance, this can be used
		* to format numbers or currency for display.
		*
		* The function arguments are as follows:
		*
		*	$element - A jQuery object representing the raw generated form element.
		*
		*	data - The POST data simpleEdit had previously sent to the saveURL,
		*			along with any data from the ajaxData option and any modifications
		*			from the beforeSave option.
		*
		*/
		afterFilter: function afterFilter($element, data){return data.newText;},

		/**
		* Whether to use the validationEngine plugin or not.
		*
		* See the jQuery validationEngine plugin for more details:
		* <https://github.com/posabsolute/jQuery-Validation-Engine>
		*
		*/
		useValidationEngine: false,

		/**
		* An object literal of the options you want simpleEdit to send to
		* the validationEngine plugin on initialization.
		*
		* See the jQuery validationEngine plugin for more details:
		* <https://github.com/posabsolute/jQuery-Validation-Engine>
		*
		*/
		validationEngineOptions: {"scroll" : true},

		/**
		* The class to append to <span>s with an empty value to modify
		* the look of the placeholder text.
		*
		* By default, the CSS for this class is:
		*
		* { color: #CCC; font-style: italic; }
		*
		*/
		placeholderClass: "simple-edit-placeholder",

		/**
		* The placeholder text to display when a <span> contains an empty value.
		* This also is simple instructions for how to edit the form field.
		*
		*/
		placeholderText: "Double-click to Edit"
	};
}(jQuery));
