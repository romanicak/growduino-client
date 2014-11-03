Frontend client for [Growduino-firmware](https://github.com/AxTheB/Growduino-firmware/)

### Implementation specifics
* FAT filesystem - filenames must be in 8.3 format.
* Parallel requests are not recommended.

### Instalace

Requirements - NodeJS, Grunt, Bower

1. checkout z repositare, klasika<br>
  `git clone git@github.com:farin/growduino-client.git`

2. sup do adresare<br>
  `cd growduino-client/`

3. nainstalovat NodeJS zavislosti (pro dev a pripadne pro proxy)<br>
  `npm install`

4. Bower pak stahne vsechny zavislosti samotne webove aplikace.<br>
  `bower install`

A tim je apliakce ready pro vyvoj:

1. Dev server na portu 8000 - serviruje src adresar a proxuje api cally na realne growduino - viz proxy.js<br>
  `node proxy`

2. Build pro arduino (verze pro rybare je distfish, zakladni verze dist - lisi se to jen v settings.js - viz Gruntfile)<br>Build je v adresari dist<br>
  `grunt distfish`


