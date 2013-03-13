Title: GUI python avec PyQT4 sous Ubuntu
Author: Alexandre Henriet
Slug: gui-python-avec-pyqt4-sous-ubuntu
Date: 2013-03-13 09:00

## Contexte

Création d'une application desktop avec python et PyQT4 sous Ubuntu 12.10.

## Installation des paquets

Certains des paquets sont nécessaires uniquement pour **Qt Creator**.

    $ sudo apt-get install python python-qt4 pyqt4-dev-tools qt4-qmake cmake qt4-designer

## Qt4 Designer

L'outil de modélisation de GUI de Qt4 est disponible via le package Ubuntu **qt4-designer** installé précédément, toutefois il est possible d'obtenir une version plus à jour en téléchargeant **Qt Creator** depuis le [site du projet Qt](http://qt-project.org/downloads).

## Création d'une GUI

Lancer **Qt4 Designer** et lorsque la pop-up **Nouveau formulaire** s'affiche, choisir **Main window**.

Faire glisser un **Buttons > Push Button** et un **Display Widgets > Label** depuis la colonne des widgets à gauche sur
la fenêtre représentant l'application au centre.

Le nom à utiliser pour se référer ultérieurement à ces derniers est accessible via l'éditeur de propriétés dans la colonne de droite,
par défaut **label** et **pushButton**. Il peut évidemment être changé de même que leurs autres propriétés.

Vérifier l'apparence qu'aura la GUI via le menu **Formulaire > Prévisualisation**.

Sauvegarder la GUI au format XML via **Fichier > Enregistrer sous ... > mainwindow.ui**.

## Classe python depuis le .ui

L'utilitaire **pyuic4** inclus dans les paquets précédents permet de générer une classe python correspondant à la fenêtre à partir du fichier **mainwindow.ui** contenant sa description XML.

    $ pyuic4 mainwindow.ui > mainwindow.py
    $ cat mainwindow.py
    
    # -*- coding: utf-8 -*-
    
    # Form implementation generated from reading ui file 'mainwindow.ui'
    #
    # Created: Wed Mar 13 06:53:56 2013
    #      by: PyQt4 UI code generator 4.9.3
    #
    # WARNING! All changes made in this file will be lost!
    
    from PyQt4 import QtCore, QtGui
    
    try:
        _fromUtf8 = QtCore.QString.fromUtf8
    except AttributeError:
        _fromUtf8 = lambda s: s
    
    class Ui_MainWindow(object):
    ...

## Application Hello world

La classe **UI_MainWindow** et la fenêtre qu'elle décrit peuvent être utilisées comme suit.

    $ cat helloworld.py 
    #!/usr/bin/env python
    
    import sys
    from PyQt4 import QtGui, QtCore
    from mainwindow import Ui_MainWindow
    
    class HelloWorld(QtGui.QMainWindow):
        """HelloWorld GUI application."""
    
        def __init__(self):
            """Constructor."""
            QtGui.QMainWindow.__init__(self)
            self.ui = Ui_MainWindow()
            self.ui.setupUi(self)
            self.connect(self.ui.pushButton, 
                         QtCore.SIGNAL("clicked()"), 
                         self.callback)
    
        def callback(self):
            """pushButton callback."""
            self.ui.label.setText("HelloWorld")
    
    def main():
        """Main function."""
        app = QtGui.QApplication(sys.argv)
        win = HelloWorld()
        win.show()
        sys.exit(app.exec_())
    
    if __name__ == "__main__":
        main()

## Enjoy

Yapuka lancer **helloworld.py** et cliquer sur le bouton.

<img class="border" alt="PyQT4 Hello world" src="./theme/img/pyqt4.png" />


## Pour aller plus loin :

* [http://www.riverbankcomputing.co.uk/software/pyqt/](http://www.riverbankcomputing.co.uk/software/pyqt/)
* [http://zetcode.com/tutorials/pyqt4/](http://zetcode.com/tutorials/pyqt4/)
* [http://www.amazon.com/s/ref=nb_sb_noss_1?field-keywords=pyqt](http://www.amazon.com/s/ref=nb_sb_noss_1?field-keywords=pyqt)
