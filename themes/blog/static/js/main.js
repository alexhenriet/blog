function slugify(text) {
  text = text.replace(/[èéêë]/g, 'e');
  text = text.replace(/[ìíîï]/g, 'i');
  text = text.replace(/[àáâãäå]/g, 'a');
  text = text.replace(/[ô]/g, 'o');
  text = text.replace(/[\s+']/g, '_');
  text = text.replace(/[^a-zA-Z0-9\-_]/g,'');
  return text.toLowerCase();
};
$(document).ready(function() {
  $("article h2").each(function() {
    this.id = slugify(this.innerHTML);
  });
  $("#toc").stoc({
    search: "article", start: 2, depth: 1, smoothScroll: 0, stocTitle: '<h2>Table des matières</h2>',
  });
});
