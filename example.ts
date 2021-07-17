import 'dotenv/config'
import { RingApi } from 'ring-client-api'
import { readFile, writeFile } from 'fs'
import { promisify } from 'util'

async function example() {
  const { env } = process,
    ringApi = new RingApi({
      // This value comes from the .env file
      refreshToken: env.RING_REFRESH_TOKEN!,
      // Listen for dings and motion events
      cameraDingsPollingSeconds: 2,
      debug: true,
    }),
    locations = await ringApi.getLocations(),
    allCameras = await ringApi.getCameras()

  console.log(
    `Found ${locations.length} location(s) with ${allCameras.length} camera(s).`
  )

  ringApi.onRefreshTokenUpdated.subscribe(
    async ({ newRefreshToken, oldRefreshToken }) => {
      console.log('Refresh Token Updated: ', newRefreshToken)

      // If you are implementing a project that use `ring-client-api`, you should subscribe to onRefreshTokenUpdated and update your config each time it fires an event
      // Here is an example using a .env file for configuration
      if (!oldRefreshToken) {
        return
      }

      const currentConfig = await promisify(readFile)('.env'),
        updatedConfig = currentConfig
          .toString()
          .replace(oldRefreshToken, newRefreshToken)

      await promisify(writeFile)('.env', updatedConfig)
    }
  )

  for (const location of locations) {
    let haveConnected = false
    location.onConnected.subscribe((connected) => {
      if (!haveConnected && !connected) {
        return
      } else if (connected) {
        haveConnected = true
      }

      const status = connected ? 'Connected to' : 'Disconnected from'
      console.log(`**** ${status} location ${location.name} - ${location.id}`)
    })
  }

  for (const location of locations) {
    const cameras = location.cameras,
      devices = await location.getDevices()

    console.log(
      `\nLocation ${location.name} (${location.id}) has the following ${cameras.length} camera(s):`
    )

    for (const camera of cameras) {
      console.log(`- ${camera.id}: ${camera.name} (${camera.deviceType})`)
    }

    console.log(
      `\nLocation ${location.name} (${location.id}) has the following ${devices.length} device(s):`
    )

    for (const device of devices) {
      console.log(`- ${device.zid}: ${device.name} (${device.deviceType})`)
    }
  }

  if (allCameras.length) {
    allCameras.forEach((camera) => {
      camera.onNewDing.subscribe((ding) => {
        const event =
          ding.kind === 'motion'
            ? 'Motion detected'
            : ding.kind === 'ding'
            ? 'Doorbell pressed'
            : `Video started (${ding.kind})`

        console.log(
          `${event} on ${camera.name} camera. Ding id ${
            ding.id_str
          }.  Received at ${new Date()}`
        )
      })
    })

    console.log('Listening for motion and doorbell presses on your cameras.')
  }
}

example()
