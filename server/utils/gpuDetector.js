// Mock GPU detection utility
// In production, this would use actual GPU detection libraries

export const detectGPU = async () => {
  // Mock GPU detection - returns a random GPU configuration
  // In production, this would use libraries like systeminformation or nvidia-smi
  
  const mockGPUs = [
    {
      name: 'NVIDIA GeForce RTX 4090',
      manufacturer: 'NVIDIA',
      model: 'RTX 4090',
      vram: 24,
      clockSpeed: 2230,
      cudaCores: 16384,
      memoryType: 'GDDR6X',
      memoryBandwidth: 1008,
      powerConsumption: 450,
      ports: ['HDMI 2.1', 'DisplayPort 1.4a', 'DisplayPort 1.4a', 'DisplayPort 1.4a'],
    },
    {
      name: 'NVIDIA GeForce RTX 4080',
      manufacturer: 'NVIDIA',
      model: 'RTX 4080',
      vram: 16,
      clockSpeed: 2210,
      cudaCores: 9728,
      memoryType: 'GDDR6X',
      memoryBandwidth: 716,
      powerConsumption: 320,
      ports: ['HDMI 2.1', 'DisplayPort 1.4a', 'DisplayPort 1.4a', 'DisplayPort 1.4a'],
    },
    {
      name: 'NVIDIA GeForce RTX 3090',
      manufacturer: 'NVIDIA',
      model: 'RTX 3090',
      vram: 24,
      clockSpeed: 1695,
      cudaCores: 10496,
      memoryType: 'GDDR6X',
      memoryBandwidth: 936,
      powerConsumption: 350,
      ports: ['HDMI 2.1', 'DisplayPort 1.4a', 'DisplayPort 1.4a', 'DisplayPort 1.4a'],
    },
    {
      name: 'AMD Radeon RX 7900 XTX',
      manufacturer: 'AMD',
      model: 'RX 7900 XTX',
      vram: 24,
      clockSpeed: 2500,
      cudaCores: 0,
      memoryType: 'GDDR6',
      memoryBandwidth: 960,
      powerConsumption: 355,
      ports: ['HDMI 2.1', 'DisplayPort 2.1', 'DisplayPort 2.1', 'DisplayPort 2.1'],
    },
    {
      name: 'NVIDIA GeForce RTX 3080',
      manufacturer: 'NVIDIA',
      model: 'RTX 3080',
      vram: 10,
      clockSpeed: 1710,
      cudaCores: 8704,
      memoryType: 'GDDR6X',
      memoryBandwidth: 760,
      powerConsumption: 320,
      ports: ['HDMI 2.1', 'DisplayPort 1.4a', 'DisplayPort 1.4a', 'DisplayPort 1.4a'],
    },
  ];

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return a random GPU from the mock list
  return mockGPUs[Math.floor(Math.random() * mockGPUs.length)];
};
