const fs = require('fs');
const path = require('path');
const {j2xParser} = require('fast-xml-parser');

const profileId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const profileFolder = path.resolve(__dirname, 'screenshot-profile');

if (!fs.existsSync(profileFolder)) {
  fs.mkdirSync(profileFolder, {recursive: true});
}

const profile = {
  id: profileId,
  name: 'Screenshot Profile',
  type: 'Unity',
  folder: profileFolder + '/',
  mobFolder: '/Assets/Resources',
  itemFolder: '/Assets/Resources/Content/EquipmentDisplay',
  buildObjectFolder: '/Assets/Resources/Content/BuildObjects',
  coordFolder: '/Assets/Resources/Content/CoordinatedEffects',
  syncFolder: '/Assets',
  defaultImage: 'default.png',
  meta: 'textureType: 8',
  limit: 10,
  iconsToShow: 50,
  delay: 500,
  notificationDelay: 25,
  image_width: 128,
  image_height: 128,
  buttonPosition: 'right',
  defaultIsActiveFilter: '-1',
  lastUsed: '',
  lastUsedVersion: '',
  created: '2026-07-04 01:00:00',
  updated: '2026-07-04 01:00:00',
  deleted: false,
  databases: [
    {type: 'admin', host: '127.0.0.1', port: '3306', database: 'atavism_admin', user: 'atavism', password: 'atavism'},
    {type: 'atavism', host: '127.0.0.1', port: '3306', database: 'atavism', user: 'atavism', password: 'atavism'},
    {type: 'master', host: '127.0.0.1', port: '3306', database: 'atavism_master', user: 'atavism', password: 'atavism'},
    {
      type: 'world_content',
      host: '127.0.0.1',
      port: '3306',
      database: 'world_content',
      user: 'atavism',
      password: 'atavism',
    },
  ],
};

const parser = new j2xParser({});
const xml = parser.parse(profile);
fs.writeFileSync(path.join(profileFolder, 'atavismeditorprofile.xml'), xml, 'utf8');
fs.writeFileSync(path.join(profileFolder, profileId + '.xml'), xml, 'utf8');
console.log('Profile folder:', profileFolder);
console.log('Profile id:', profileId);
