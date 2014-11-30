Frontend client for [Growduino-firmware](https://github.com/AxTheB/Growduino-firmware/)

### Implementation specifics
* FAT filesystem - filenames must be in 8.3 format.
* Parallel requests are not recommended.

### Instalace

Requirements - NodeJS, Grunt, Bower

1. Nainstalovat GIT pomoci:<br> `sudo apt-get install git`
2. Naklonovat si repository pomoci:<br> `git clone https://github.com/romanicak/growduino-client`
3. Sup do adresare:<br> `cd growduino-client`
4. Nainstalovat NPM pomoci:<br> `sudo apt-get install npm`
5. Nainstalovat NodeJS zavislosti (pro dev a pripadne pro proxy):<br> `npm install`
6. Nainstalovat Bower pomoci:<br> `sudo npm install -g bower`
7. Dostat Node na spravnou cestu, on uz se totiz jmenuje NodeJS:<br> `sudo ln -s /usr/bin/nodejs /usr/bin/node`
8. Bower pak stahne vsechny zavislosti samotne webove aplikace:<br> `bower install`
9. Nainstalovat Grunt pomoci:<br> `sudo npm install -g grunt-cli`<br>
-- Ted je vse pripraveno pro build, nasledujici je potreba pro editaci a testy--<br>
10. Spustit proxy pomoci:<br> `node proxy`
11. V prohlizeci by se ted pod adresou localhost:8000 mel zobrazit lokalni web co si taha data ze skutecnyho Growduina<br>
12. Stahnout editor, treba http://www.sublimetext.com/ (rozbalit a instalovat jde ve voknech) spustit z terminalu pomoci:<br> `subl`
13. Po editaci (staci tam pretahovat co chci editovat) se buildi pomoci:<br> `grunt dist` <br>(kde dist je parametr jakou distribuci buildit, pro rybare je to distfish)

