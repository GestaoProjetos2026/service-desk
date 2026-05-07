# Azure VPS Setup Guide for Staging & Production

Follow this guide to create your Virtual Private Server on Azure, configure it, and connect it to your GitHub Actions pipeline.

## 1. Create the VM in Azure Portal
1. Go to the [Azure Portal](https://portal.azure.com/).
2. Search for **Virtual Machines** and click **Create -> Azure Virtual Machine**.
3. **Basics Tab:**
   - **Resource Group:** Create a new one (e.g., `rg-servicedesk`).
   - **Virtual machine name:** `vm-servicedesk`
   - **Region:** Choose the region closest to you.
   - **Image:** `Ubuntu Server 22.04 LTS` (Highly recommended for Docker).
   - **Size:** A `B1s` or `B2s` instance is usually enough for a small staging/production environment.
   - **Administrator account:**
     - Select **SSH public key**.
     - **Username:** `azureuser`
     - **SSH public key source:** Generate new key pair.
     - **Key pair name:** `servicedesk-ssh-key`.
   - **Inbound port rules:** Allow SSH (22), HTTP (80), and HTTPS (443).
4. Click **Review + create**, then **Create**.
5. **CRITICAL:** A prompt will appear to download your private key. **Download it and save it securely.** You will need this for GitHub Actions.

## 2. Configure the VPS (Install Docker)
Once the VM is running, copy its **Public IP address** from the Azure Portal.

Open your terminal and SSH into the machine using the key you downloaded:
```bash
# Change permissions on your downloaded key so SSH doesn't complain
chmod 400 ~/Downloads/servicedesk-ssh-key.pem

# SSH into the server
ssh -i ~/Downloads/servicedesk-ssh-key.pem azureuser@<YOUR_VPS_PUBLIC_IP>
```

Once inside the VPS, install Docker and Docker Compose:
```bash
# 1. Update packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Add your user to the docker group (so you don't need 'sudo' for docker commands)
sudo usermod -aG docker $USER
```
*Note: You may need to log out and log back into the SSH session for the Docker group change to take effect.*

## 3. Prepare the Server Directories
Your GitHub Actions script expects specific folders to exist for deployment:

Run this on your VPS:
```bash
# Create folders for staging and production
mkdir -p /home/azureuser/service-desk/staging
mkdir -p /home/azureuser/service-desk/production

# Initialize an empty git repository in both to allow Git pull commands
cd /home/azureuser/service-desk/staging
git clone https://github.com/GestaoProjetos2026/Service-Desk.git .

cd /home/azureuser/service-desk/production
git clone https://github.com/GestaoProjetos2026/Service-Desk.git .
```

## 4. Set Up GitHub Secrets
Now, connect your GitHub repository to your Azure VPS so the automated pipeline can push updates.

Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
Click **New repository secret** and add these three secrets:

1. **`SERVER_HOST`**: Paste the **Public IP address** of your Azure VM.
2. **`SERVER_USERNAME`**: `azureuser`
3. **`SERVER_SSH_KEY`**: Open the `servicedesk-ssh-key.pem` file you downloaded from Azure in a text editor. Copy all of the contents (including the `-----BEGIN RSA PRIVATE KEY-----` and `-----END...` lines) and paste it here.

---

> [!TIP]
> **What I changed in your code:**
> I updated the `.github/workflows/deploy.yml` file to correctly point to `/home/azureuser/service-desk/${{ env.ENV_NAME }}` which matches the directory structure we created in Step 3 of this guide. No further code changes are needed!
