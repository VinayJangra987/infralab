# InfraLab: IT Ops Practice Simulator

An interactive training environment that simulates the daily work of an IT Operations helpdesk. Built with plain HTML, CSS and JavaScript (no frameworks, no backend).

Note: this is a simulator, not a real Active Directory or Microsoft 365 tenant.

## Features
- **Active Directory:** create users, reset passwords, unlock, disable/enable, add to groups, move between OUs, search
- **Microsoft 365:** shared mailboxes (grant/revoke access), distribution lists, licence assignment with a seat limit
- **Entra ID and MFA:** Conditional Access toggle, MFA re-registration, sign-in blocking, test sign-ins with failure reasons and logs
- **Devices (Intune/SCCM style):** enrol, sync, install updates, deploy apps, remote lock, retire
- **PowerShell console:** Get-ADUser, New-ADUser, Unlock-ADAccount, Set-ADAccountPassword, Add-ADGroupMember and more. It shares state with the GUI
- **Missions:** 9 guided tasks with hints and automatic validation
- Activity log with export, and a one-click lab reset

## Run
Open `index.html` in a browser. Data is saved in the browser (localStorage).

## Project structure
```
index.html   page layout
style.css    styles
app.js       lab state, actions, PowerShell parser, missions
```

## Deploy
Push to GitHub, then enable GitHub Pages (Settings, Pages, branch main) or import the repo in Vercel.
