const fs = require('fs');

const files = {
  'ingr_asian_rice_labor.txt': 'asian rice belt',
  'ingr_developed_asia.txt': 'developed asia',
  'ingr_easern_europe.txt': 'east eu',
  'ingr_latam_agrarian.txt': 'latin america',
  'ingr_mediterranean.txt': 'mediterranean',
  'ingr_mena_arid.txt': 'mena',
  'ingr_north_america.txt': 'north america',
  'ingr_nothern_Import.txt': 'north import',
  'ingr_oceanic.txt': 'oceanic',
  'ingr_sub_saharan_africa.txt': 'subsaharan_subsistence',
  'ingr_western_europe.txt': 'west eu'
};

const ingredients = {};

// Parse each file
for (const [file, zone] of Object.entries(files)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() && !l.match(/^[\s\u200B]*$/));
  
  for (const line of lines) {
    // Match pattern: "Ingredient Name Price" or "Ingredient Name  Price"
    const match = line.match(/^(.+?)\s+([\d.]+)$/);
    if (match) {
      const name = match[1].trim();
      const price = match[2].trim();
      if (!ingredients[name]) {
        ingredients[name] = {};
      }
      ingredients[name][zone] = price;
    }
  }
}

// Generate output
const output = [];
const sortedNames = Object.keys(ingredients).sort();

for (const name of sortedNames) {
  output.push(name + ':');
  
  const zoneOrder = [
    'east eu',
    'west eu',
    'north import',
    'mediterranean',
    'north america',
    'latin america',
    'asian rice belt',
    'developed asia',
    'mena',
    'oceanic',
    'subsaharan_subsistence'
  ];
  
  for (const zone of zoneOrder) {
    if (ingredients[name][zone]) {
      output.push(zone + ' ' + ingredients[name][zone]);
    }
  }
  
  output.push(''); // Empty line between ingredients
}

fs.writeFileSync('prices.txt', output.join('\n'));
console.log('prices.txt created successfully with', sortedNames.length, 'ingredients');


