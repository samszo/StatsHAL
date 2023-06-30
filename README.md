# StatsHAL
https://samszo.github.io/StatsHAL
# Stage de Rim Kaidi - Représentations des données du laboratoire
Ce répertoire GitHub a été créé dans le cadre du stage de Rim Kaidi, étudiante à l'université Paris 8 et stagiaire au sein du laboratoire paragraphe, pour stocker les codes relatifs aux différentes représentations des données du laboratoire. Ce projet vise à visualiser les données du laboratoire Paragraphe, notamment collaborations avec d'autres structures sur la plateforme HAL (l'archive ouverte), que ce soit à l'échelle mondiale, régionale ou départementale, à l'aide de cartes coroplèthes.
Les codes des cartes sont récupérés du site "DATAVIS" https://www.datavis.fr/
# Présentation des cartes coroplèthes
Nous avons développé trois cartes coroplèthes pour illustrer les différentes collaborations du laboratoire :
## Carte mondiale des collaborations : 
Cette carte met en évidence les partenariats et les collaborations du laboratoire Paragraphe avec d'autres structures à travers le monde. Elle permet d'avoir une vision globale des interactions internationales.

<img width="1317" alt="Capture d’écran 2023-06-30 à 08 17 45" src="https://github.com/samszo/StatsHAL/assets/114165475/f002089f-adac-4f39-b375-d8889ddd8a96">

Source : https://www.datavis.fr/d3js/map-improve

## Carte des régions françaises : 
Elle présente les collaborations du laboratoire Paragraphe avec des structures situées dans différentes régions de la France. Elle permet de visualiser les collaborations à l'échelle nationale et de mettre en évidence les relations interrégionales.

<img width="958" alt="Capture d’écran 2023-06-29 à 23 45 58" src="https://github.com/samszo/StatsHAL/assets/114165475/aef046e9-fedc-4bc5-9fa2-d07395c7fa00">

Source : https://www.datavis.fr/d3js/map-population
## Carte des départements français : 
C'est la dernière carte réalisée pour ce projet, elle se concentre sur les collaborations du laboratoire avec des structures spécifiques dans les différents départements de la France. Elle offre une vision plus détaillée des partenariats locaux et permet de mettre en avant les relations interdépartementales.

Source : https://www.datavis.fr/d3js/map-population
# Difficultés rencontrées lors de la récupération des données
Lors de la récupération des données des collaborations pour les régions et les départements, nous avons fait face à plusieurs difficultés. Tout d'abord, nous n'avons pas trouvé de requête d'API HAL permettant de récupérer automatiquement les adresses des structures collaboratrices. En conséquence, nous avons dû recourir à une approche manuelle pour collecter ces informations.
Nous avons créé un tableur Excel dans lequel nous avons consigné les détails des collaborations, y compris les adresses des structures. Cependant, malgré nos efforts, certaines adresses ont été difficiles à trouver, ce qui a entraîné des données manquantes dans notre ensemble de données.
Le processus de collecte manuelle des adresses a pris beaucoup de temps et a demandé un travail minutieux. Nous avons effectué des recherches approfondies en utilisant différentes sources disponibles, telles que les sites Web des structures, les annuaires en ligne et les bases de données publiques. Malgré cela, certaines adresses se sont avérées introuvables ou difficiles à vérifier.
