var EmberHandlebarsLoader = {
  loadTemplates: function(templateNames) {
  	for(var fileName in templateNames) {
  	  var emberName = templateNames[fileName] || fileName;
      $.ajax({
        url: "templates/" + fileName + ".hbs",
        async: false,
        success: function(template) {
          var compiledTemplate = Ember.Handlebars.precompile(template);
          Ember.TEMPLATES[emberName] = Ember.Handlebars.template(compiledTemplate);
        }
      });
    }
  }
};
