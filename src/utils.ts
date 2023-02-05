import path from 'path';
import fs from 'fs';
const rimraf = require('rimraf');

export const outputDirectory = path.resolve('output/');

export async function cleanOutputDirectory() {
    await rimraf(outputDirectory);
    const createDir = await fs.promises.mkdir(outputDirectory, { recursive: true });

    console.log(`created ${createDir}`);
}
