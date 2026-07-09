const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.match(/\.(ts|tsx|js|jsx)$/)) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Replace console.log entirely or comment it out
    const newContent = content.replace(/^[ \t]*console\.log\(.*$/gm, '');
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log("Cleaned:", file);
    }
});
