jQuery Simple Edit Plugin
======================

##Introduction

This jQuery plugin is meant to simplify client-side form editing. It has the ability to quickly enable one
form value to be edited on the fly, by double-clicking, and then submitted to the server for saving.
SimpleEdit also supports classic full form editing (known as editAll mode).

##Requirements

- jQuery 1.6

##Demo Requirements

- A web server running PHP5.2+
- jQuery 1.6+ (included)
- jQueryUI 1.8.18 + theme (included)
- jQuery Validation Engine + language file (included)

##Getting Started

To get started, download either `jquery.simpleEdit.js` (uncompressed) or `jquery.simpleEdit.min.js`
(compressed) JavaScript file, the `jquery.simpleEdit.css` file and include them in your HTML:

```HTML
<link href="css/jquery.simpleEdit.css" type="text/css" rel="stylesheet"></link>
<script src="js/jquery.simpleEdit.min.js"></script>
```

Use the following HTML markup to make form fields:

```HTML
<label>Username</label>
<span class="editable" data-se-type="text" data-se-name="username">

</span>
<label>Phone</label>
<span class="editable" data-se-type="text" data-se-name="userphone">

</span>
```

Then, in your jQuery `$(document).ready()`, or elsewhere, to initiate simpleEdit:

```JavaScript
$.simpleEdit({
	saveUrl: "/Users/update",
	editAllTrigger: "#editAll"
});
```
##EditAll Mode

The `editAllTrigger` is a simple jQuery selector for any element (button, link, etc.) that will cause all `.editable`
form fields to be editable when clicked.

##Server Request

Upon saving, simpleEdit will send a single POST request to the `saveURL` provided with the `se-name` of the edited `<span>`
as a key using the user-specified value as the value. You can also have simpleEdit send additional data along (such as a user ID), see Configuration below.

Here is an example of what a single edit would look like:

```JavaScript
{
	username: "CoolDude22"
}
//Raw POST: username=CoolDude22
```

Here is an example of a mass (multi) edit:

```JavaScript
{
	username: "CoolDude22",
	userphone: "555-1001"
}
// Raw POST: username=CoolDude22&userphone=555-1001
```

##Server Response

The server should send a JSON response to the save request in the following format:

```JavaScript
{
	"success": true // true if save was successful, false if not
}
```

Sending `false` back will prevent simpleEdit from updating the value in the HTML.
Additional data can be sent back in this request and used. See Configuration below.

##Span Markup

The HTML markup used for the `<span>` will determine how simpleEdit responds to that particular form field. The options
are as follows:

```JavaScript
{
	se-type: "text", // One of text, password, email, select, checkbox, radio, or textarea
                     // Pair with jQueryUI and use "datepicker" or "autocomplete".
	se-name: "myFieldName", // The field name to save the form field as.
	se-validation: "validation[required]", // The validation rules needed to validate this form field by the jQuery Validation Engine
	se-opts: {"on":"Yes","off":"No"}, // The <option>s for select se-types or the additional <radio>s for radio
									  // in a key-value pair
                                      // When using datapicker or autocomplete, this is the standard configuration object passed to
                                      // those objects on initialization
	se-ajax-data: '{"fieldID":"215315"}' // Any field-level specific data you want simpleEdit to send to saveURL in addition to the
										 // field se-name and field value.
}
```

For example, the following `<span>` markup:

```HTML
<label>Preferred Contact Method</label>
<span class="editable" data-se-validation="validation[required]" data-se-type="select"
 data-se-name="preferred-contact" data-se-opts='{"":"","email":"Email","homephone":"Home Phone","cellphone":"Cell Phone","tweet":"Twitter"}'>

</span>
```
Will generate the following real form field during editing:

```HTML
<select name="preferred-contact">
	<option value=""></option>
	<option value="email">Email</option>
	<option value="homephone">Home Phone</option>
	<option value="cellphone">Cell Phone</option>
	<option value="tweet">Twitter</option>
</select>
```

This `<select>` cannot have the first blank option selected because the validation was set to required.

##jQuery ValidationEngine Plugin

simpleEdit can integrate with the [jQuery Validation Engine](https://github.com/posabsolute/jQuery-Validation-Engine) plugin to provide form field validation
in either single or editAll modes. Include the jQuery Validation Engine on your page and then
simply add `data-se-validation="insert-your-validation-rules-here"` to the
`<span>` markup.

For example:

```HTML
<label>City</label>
<span class="editable" data-se-validation="validate[custom[onlyLetterSp]]" data-se-type="text" data-se-name="city">

</span>
```

Lastly, be sure to initiate simpleEdit with the validation engine plugin option:

```JavaScript
$.simpleEdit({
	saveUrl: "/Users/update",
	editAllTrigger: "#editAll",
	useValidationEngine: true
});
```

##Configuration

simpleEdit provides quite a few different options for customizing its behavior (the values shown are defaults):

```JavaScript
{
	/**
	* The URL simpleEdit will save form data to. Can be absolute or relative.
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
}
```

##Demo Application

There is a sample application built for your reference included.

##Getting Help

If you need help with jQuery Simple Edit, please open an issue.

##License

Licensed under the MIT License

Copyright (c) 2012 Adam Radabaugh

Permission is hereby granted, free of charge, to any person obtaining a copy of this software
and associated documentation files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
