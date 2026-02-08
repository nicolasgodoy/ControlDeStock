const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando proceso de construcción...');

// 1. Limpiar o crear carpeta dist
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    console.log('🧹 Limpiando carpeta dist...');
    fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });
fs.mkdirSync(path.join(distPath, 'js'), { recursive: true });

// 2. Ofuscar archivos
console.log('🛡️ Ofuscando archivos JavaScript...');
try {
    execSync('npx javascript-obfuscator src --output dist/js --compact true', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Error durante la ofuscación:', error);
    process.exit(1);
}

// 3. Copiar archivos estáticos
const filesToCopy = ['index.html', 'estilos.css'];
filesToCopy.forEach(file => {
    const source = path.join(__dirname, '..', file);
    const destination = path.join(distPath, file);
    if (fs.existsSync(source)) {
        console.log(`📋 Copiando ${file}...`);
        fs.copyFileSync(source, destination);
    } else {
        console.warn(`⚠️ Advertencia: No se encontró ${file}`);
    }
});

console.log('✅ ¡Construcción completada con éxito!');
