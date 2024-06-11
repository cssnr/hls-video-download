// JS for options.html

import {
    checkClientVersion,
    checkPerms,
    grantPerms,
    linkClick,
    onAdded,
    onRemoved,
    revokePerms,
    saveOptions,
    showToast,
    testNativeMessage,
    updateManifest,
    updateOptions,
} from './export.js'

chrome.storage.onChanged.addListener(onChanged)
chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', initOptions)
document
    .querySelectorAll('.revoke-permissions')
    .forEach((el) => el.addEventListener('click', revokePerms))
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', grantPerms))
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', linkClick))
document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .getElementById('options-form')
    .addEventListener('submit', (e) => e.preventDefault())
document
    .querySelectorAll('.native-message')
    .forEach((el) => el.addEventListener('click', testNativeMessage))
document
    .querySelectorAll('.check-version')
    .forEach((el) => el.addEventListener('click', checkVersion))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

/**
 * Initialize Options
 * @function initOptions
 */
async function initOptions() {
    console.debug('initOptions')

    updateManifest()
    await setShortcuts()
    await checkPerms()

    const { options } = await chrome.storage.sync.get(['options'])
    console.debug('options:', options)
    updateOptions(options)
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    console.debug('onChanged:', changes, namespace)
    for (const [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'sync') {
            if (key === 'options') {
                updateOptions(newValue)
            }
        }
    }
}

/**
 * Set Keyboard Shortcuts
 * @function setShortcuts
 * @param {String} selector
 */
async function setShortcuts(selector = '#keyboard-shortcuts') {
    const table = document.querySelector(selector)
    const tbody = table.querySelector('tbody')
    const source = table.querySelector('tfoot > tr').cloneNode(true)
    const commands = await chrome.commands.getAll()
    for (const command of commands) {
        // console.debug('command:', command)
        const row = source.cloneNode(true)
        // TODO: Chrome does not parse the description for _execute_action in manifest.json
        let description = command.description
        if (!description && command.name === '_execute_action') {
            description = 'Show Popup'
        }
        row.querySelector('.description').textContent = description
        row.querySelector('kbd').textContent = command.shortcut || 'Not Set'
        tbody.appendChild(row)
    }
}

async function checkVersion(event) {
    console.debug('checkVersion:', event)
    const btn = event.target.closest('button')
    btn.classList.add('disabled')
    const version = await checkClientVersion()
    console.debug('version:', version)
    if (!version) {
        btn.classList.remove('disabled')
        showToast('Error Checking Client Version.', 'danger')
        return
    }
    const versionInfo = document.getElementById('version-info')
    versionInfo.querySelector('.current').textContent = version.current
    versionInfo.querySelector('.latest').textContent = version.latest
    versionInfo.classList.remove('d-none')
    if (version.update) {
        showToast('New Version Available.', 'warning')
        versionInfo.classList.add('text-danger-emphasis')
    } else {
        showToast('Client Version is Up to Date.', 'success')
        versionInfo.classList.add('text-success-emphasis')
    }
}
