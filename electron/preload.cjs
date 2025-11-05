const { contextBridge } = require('electron')
const { machineIdSync } = require('node-machine-id')

// Expose a minimal API to the renderer to retrieve a stable machine identifier
// This is used to bind licenses to a single device.
contextBridge.exposeInMainWorld('licenseAPI', {
  getMachineId: () => {
    try {
      // Use original machine id, do not hash, to keep consistency
      const id = machineIdSync({ original: true })
      return id
    } catch (e) {
      return 'unknown'
    }
  },
})