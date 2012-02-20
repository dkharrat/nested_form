jQuery(function($) {
  window.NestedFormEvents = function() {
    this.addFields = $.proxy(this.addFields, this);
    this.removeFields = $.proxy(this.removeFields, this);
  };

  NestedFormEvents.prototype = {
    addFields: function(e) {
      // Setup
      var link    = e.currentTarget;
      var assoc   = $(link).attr('data-association');            // Name of child
      var content = $('#' + assoc + '_fields_blueprint').text(); // Fields template
      
      // it is expected that the fields template stored in content is wrapped by a
      // single tag (e.g. div, tr, p, etc.) having class 'fields'

      // Make the context correct by replacing new_<parents> with the generated ID
      // of each of the parent objects
      var context = ($(link).closest('.fields').find('input:first').attr('name') || '').replace(new RegExp('\[[a-z]+\]$'), '');

      // context will be something like this for a brand new form:
      // project[tasks_attributes][new_1255929127459][assignments_attributes][new_1255929128105]
      // or for an edit form:
      // project[tasks_attributes][0][assignments_attributes][1]
      if (context) {
        var parentNames = context.match(/[a-z_]+_attributes/g) || [];
        var parentIds   = context.match(/(new_)?[0-9]+/g) || [];

        for(var i = 0; i < parentNames.length; i++) {
          if(parentIds[i]) {
            content = content.replace(
              new RegExp('(_' + parentNames[i] + ')_.+?_', 'g'),
              '$1_' + parentIds[i] + '_');

            content = content.replace(
              new RegExp('(\\[' + parentNames[i] + '\\])\\[.+?\\]', 'g'),
              '$1[' + parentIds[i] + ']');
          }
        }
      }

      // Make a unique ID for the new child
      var regexp  = new RegExp('new_' + assoc, 'g');
      var new_id  = new Date().getTime();
      content     = content.replace(regexp, "new_" + new_id);

      var field = this.insertFields(content, assoc, link);
      $(link).closest("form")
        .trigger({ type: 'nested:fieldAdded', assoc: assoc, field: field })
        .trigger({ type: 'nested:fieldAdded:' + assoc, field: field });
      return false;
    },
    insertFields: function(content, assoc, link) {
      // append the new field to the end of the association's section
      return $(content).appendTo($('form #' + assoc + '_fields'));
    },
    removeFields: function(e) {
      var link = e.currentTarget;
      var hiddenField = $(link).prev('input[type=hidden]');
      hiddenField.val('1');
      // if (hiddenField) {
      //   $(link).v
      //   hiddenField.value = '1';
      // }
      var assoc = $(link).closest('[id$=fields]').attr('id').match(/([a-z_]+)_fields/)[1];
      var field = $(link).closest('.fields');
      field.hide();
      $(link).closest("form").trigger({ type: 'nested:fieldRemoved', assoc: assoc, field: field });
      $(link).closest("form").trigger({ type: 'nested:fieldRemoved:' + assoc, field: field });
      return false;
    }
  };

  window.nestedFormEvents = new NestedFormEvents();
  $('form a.add_nested_fields').live('click', nestedFormEvents.addFields);
  $('form a.remove_nested_fields').live('click', nestedFormEvents.removeFields);
});

function nested_form_get_children(assoc_name) {
    return $('#' + assoc_name + '_fields').find('.fields:visible');
}

function nested_form_get_add_button(assoc_name) {
    return $('#' + assoc_name + '_fields').find('.add_nested_fields');
}
