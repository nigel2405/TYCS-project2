# 🛠️ GPU Provider Setup Guide

Welcome to the GPU Sharing Platform! To host workloads effectively and ensure your GPU is fully utilized by consumers, follow these setup steps.

---

## 📋 Prerequisites
1.  **NVIDIA GPU**: Ensure you have a physical NVIDIA GPU installed.
2.  **Latest Drivers**: Download and install the latest [NVIDIA Drivers](https://www.nvidia.com/download/index.aspx).
3.  **Docker Desktop**: [Download and install](https://www.docker.com/products/docker-desktop/) Docker Desktop.

---

## 🧪 Step 1: Quick Verification
Before installing anything else, check if your system is already configured correctly.
Open **PowerShell** and run:
```powershell
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```
*   **IF SUCCESSFUL**: You see a table with your GPU name. **You are ready!** Skip the rest of this guide.
*   **IF IT FAILS**: (e.g., "could not select device driver"), proceed to Step 2.

---

## 🔧 Step 2: Configure Docker Desktop
1.  Open **Docker Desktop Settings**.
2.  Go to **General** -> Ensure **"Use the WSL 2 based engine"** is checked.
3.  Go to **Resources** -> **WSL Integration** -> Toggle **ON** for your default distribution (e.g., Ubuntu).

---

## 📥 Step 3: Install NVIDIA Container Toolkit (Via WSL)
This is the "bridge" that lets Docker see your GPU. Run these commands inside your **WSL/Ubuntu terminal**:

### 1. Setup the Repository
```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

### 2. Install the Toolkit
```bash
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
```

### 3. Configure Docker Runtime
```bash
sudo nvidia-ctk runtime configure --runtime=docker
```

---

## 🔄 Step 4: Final Restart
1.  **Restart Docker Desktop**: Right-click the Docker icon in your system tray and select **Restart**.
2.  **Verify again**: Run the command from **Step 1** again. It should now show your GPU table!

---

## 🚀 Running the Agent
Once the hardware is ready:
1.  Open a terminal in this folder.
2.  Install dependencies: `pip install -r requirements.txt`
3.  Start the agent: `python gpu_agent.py`

Your GPU is now live and ready to earn! 💰
