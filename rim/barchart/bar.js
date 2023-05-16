// Chargement du fichier CSV
d3.csv("dataa.csv", function (data) {
  // Création d'un nouvel SVG
  var svg = dimple.newSvg("#chartContainer", 1000, 700);

  // Création du graphique Dimple.js
  var myChart = new dimple.chart(svg, data);

  // Configuration des axes
  var x = myChart.addCategoryAxis("x", "Grade");
  x.addOrderRule("Sous grade");
  x.barGap = 0.2;


  var y = myChart.addMeasureAxis("y", "Nombre de membres");

  // Configuration des séries pour chaque sous-grade
  var s = myChart.addSeries("Sous grade", dimple.plot.bar);

  // Ajout de la légende
  myChart.addLegend(60, 10, 510, 20, "right");

  // Dessin du graphique
  myChart.draw();
});
