import "dotenv/config";
import { 
    RingApi,
    RingCamera
} from "ring-client-api";
import { 
    readFile, 
    writeFile 
} from "fs";
import { promisify } from "util";
import * as path from 'path';
import { 
    cleanOutputDirectory, 
    outputDirectory 
} from './utils';
import {google} from 'googleapis';
import fs from 'fs';


async function uploadRingFileToDrive(filePath: string, fileName:string, folderId: string) {
    console.log('Starting auth to Google Drive');
    const auth = new google.auth.GoogleAuth({
        keyFile: './serviceAccount.json',
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({
        version: 'v3',
        auth: auth
    });
    console.log('Done auth to Google Drive');


    const fileMetadata = {
        name: fileName,
        parents: [folderId],
        mimeType: 'video/mp4'
    };
    const media = {
        mimeType: 'video/mp4',
        body: fs.createReadStream(filePath)
    };
    console.log('Uploading video to Google Drive')
    const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media
    });
    console.log('Done uploading video to Google Drive')
    console.log(file.data);
}

async function start() {
    const { env } = process,
    ringApi = new RingApi({
      // This value comes from the .env file
      refreshToken: env.RING_REFRESH_TOKEN!,
      debug: true,
    }),
    allCameras = await ringApi.getCameras();

    console.log(
        `Found ${allCameras.length} camera(s).`
    );
    
    ringApi.onRefreshTokenUpdated.subscribe(
        async ({ newRefreshToken, oldRefreshToken }: {newRefreshToken: string , oldRefreshToken?: string | undefined}) => {
        console.log("Refresh Token Updated: ", newRefreshToken);

        if (!oldRefreshToken) {
            return;
        }

        // Update the config file with the new refresh token
        const currentConfig = await promisify(readFile)(".env"),
            updatedConfig = currentConfig
            .toString()
            .replace(oldRefreshToken, newRefreshToken);

        await promisify(writeFile)(".env", updatedConfig);
        }
    );
    
    if (allCameras.length) {
        for (const camera of allCameras) {
            console.log(`Found camera: ${camera.name} (${camera.id})`);
            // This is where we listen for motion and doorbell presses and record the video
            camera.onMotionDetected.subscribe(async (motion: boolean) => {
                if (motion) {
                    const fileName = `${Date.now()}.mp4`;
                    await recordVideo(camera, fileName);
                    await sendVideoToDrive(fileName, env.FOLDER_ID!);
                }
            });
            const fileName = `${Date.now()}.mp4`;
            await recordVideo(camera, fileName);
            await sendVideoToDrive(fileName, env.FOLDER_ID!);
        }
        console.log("Listening for motion and doorbell presses on your cameras, records for 10 seconds when detected");
    }
}

// clean/create the output directory
async function recordVideo(camera: RingCamera, fileName: string) {
    await cleanOutputDirectory();
    console.log(`Starting Video from ${camera.name} ... to ${path.join(outputDirectory, fileName)}`);
    await camera.recordToFile(`${path.join(outputDirectory, fileName)}`, 10);
    console.log('Done recording video');
    
}

// Sends file to Google Drive
async function sendVideoToDrive(fileName: string, folderId: string) {
    await uploadRingFileToDrive(`${path.join(outputDirectory, fileName)}`,fileName,  folderId);
}

start().catch((e) => {
    console.error(e);
});
