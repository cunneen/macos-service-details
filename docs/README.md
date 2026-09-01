# MacOS Config Notes

Notes on MacOS configuration internals.

## Contents

- [MacOS Config Notes](#macos-config-notes)
  - [Contents](#contents)
  - [Handy Utilities](#handy-utilities)
  - [Config File Locations](#config-file-locations)
    - [LaunchAgents](#launchagents)
    - [Privileged Helper Tools](#privileged-helper-tools)
    - [App Preferences](#app-preferences)
    - [Listing all Plist files in the above folders](#listing-all-plist-files-in-the-above-folders)
    - [Searching for a string in all plist files in the above folders](#searching-for-a-string-in-all-plist-files-in-the-above-folders)
  - [`ServicesMenu.Services.plist`](#servicesmenuservicesplist)
  - [`sfltool`](#sfltool)
  - [`dscl`](#dscl)
  - [System Extensions](#system-extensions)
    - [Where to find info and how to report on system extensions in macOS Catalina+](#where-to-find-info-and-how-to-report-on-system-extensions-in-macos-catalina)
      - [Staged system extensions location in folder based on unique ID](#staged-system-extensions-location-in-folder-based-on-unique-id)
      - [Info on each](#info-on-each)
    - [CLI tools](#cli-tools)
  - [`LSSharedFileList.ApplicationRecentDocuments`](#lssharedfilelistapplicationrecentdocuments)
  - [`launchctl`](#launchctl)
    - [Example `launchctl` commands](#example-launchctl-commands)
  - [`scutil`](#scutil)
    - [Example `scutil` commands](#example-scutil-commands)
    - [Get all the values](#get-all-the-values)
      - [`scutil` Command to Extract All Values](#scutil-command-to-extract-all-values)

## Handy Utilities

These are both commercial, but both are still useful in 'trial' or 'free' mode:

- [Lingon Pro](https://www.peterborgapps.com/lingon/)
- [LaunchControl](http://www.soma-zone.com)

[🔝](#contents)

## Config File Locations

[🔝](#contents)

### LaunchAgents

Launch Agent configuration is in the following standard locations:

- `${HOME}/Library/LaunchAgents`
- `/Library/LaunchAgents`
- `/Library/LaunchDaemons`
- `/System/Library/LaunchAgents`
- `/System/Library/LaunchDaemons`

[🔝](#contents)

### Privileged Helper Tools

- `/Library/PrivilegedHelperTools`

[🔝](#contents)

### App Preferences

These don't necessarily get loaded, it's just the standard location for applications to store user preferences.

- `${HOME}/Library/Preferences`

[🔝](#contents)

### Listing all Plist files in the above folders

  ```sh
  LAUNCHD_FOLDERS=(
    ${HOME}/Library/LaunchAgents
    /Library/LaunchAgents
    /Library/LaunchDaemons
    /System/Library/LaunchAgents
    /System/Library/LaunchDaemons
    /Library/PrivilegedHelperTools
    ${HOME}/Library/Preferences
  )

  for folder in "${LAUNCHD_FOLDERS[@]}"; do
    if [[ -d "$folder" ]]; then
      echo "$folder"
      echo "------"
      ls -l "$folder"
      echo
    fi
  done 
  ```

[🔝](#contents)

### Searching for a string in all plist files in the above folders

The `-i` flag makes the search case-insensitive

- zsh version :

  ```sh
  LAUNCHD_FOLDERS=(
    ${HOME}/Library/LaunchAgents
    /Library/LaunchAgents
    /Library/LaunchDaemons
    /System/Library/LaunchAgents
    /System/Library/LaunchDaemons
    /Library/PrivilegedHelperTools
    ${HOME}/Library/Preferences
  )

  read 'SEARCH_STRING?Enter your search string> '
  grep -irls "${SEARCH_STRING}" "${LAUNCHD_FOLDERS[@]}"
  ```

- bash version :

  ```sh
  LAUNCHD_FOLDERS=(
    ${HOME}/Library/LaunchAgents
    /Library/LaunchAgents
    /Library/LaunchDaemons
    /System/Library/LaunchAgents
    /System/Library/LaunchDaemons
    /Library/PrivilegedHelperTools
    ${HOME}/Library/Preferences
  )

  read -p 'Enter your search string> ' SEARCH_STRING
  grep -irls "${SEARCH_STRING}" "${LAUNCHD_FOLDERS[@]}"
  ```

[🔝](#contents)

## `ServicesMenu.Services.plist`

- Located at `${HOME}/Library/Preferences/com.apple.ServicesMenu.Services.plist`
- Contains ALL the items that *can* appear in the `Services` context menu in MacOS Finder when you right-click something.

- To view it in JSON format within vscode:

    ```sh
    plutil -convert json -r -o - --  ${HOME}/Library/Preferences/com.apple.ServicesMenu.Services.plist | code -
    ```

    If (like me) you got an error: `Invalid object in plist for JSON format`, you can try human-readable format:

    ```sh
    plutil -p --  ${HOME}/Library/Preferences/com.apple.ServicesMenu.Services.plist | code -
    ```

[🔝](#contents)

## `sfltool`

The MacOS `sfltool` command allows some configuration of the "shared file list".

- `sfltool archive -z` creates an archive snapshot. Running that command will output   something like:
  
    ```sh-session
    SharedFileList storage archived to '/tmp/SFL-archive_2026.08.19_18-34-53-AWST.tgz'
    ```
  
    This seems to be the recent file list ?

- `sfltool dumpbtm` dumps the configured services
  - The output is in a human-readable text format:

    ```properties
    ========================
    Records for UID -2 : FFFFEEEE-DDDD-CCCC-BBBB-AAAAFFFFFFFE
    ========================

    ServiceManagement migrated: true
    LaunchServices registered: false

    Items:

    #1:
                    UUID: 928B54C9-1DF0-4890-9961-5F1CA140D05C
                    Name: (null)
          Developer Name: (null)
                    Type: developer (0x20)
                    Flags: [  ] (0)
              Disposition: [disabled, allowed, not notified] (0x2)
              Identifier: Unknown Developer
                      URL: (null)
              Generation: 0
      Embedded Item Identifiers:
        #1: com.apple.amsdstat

    #2:
                    UUID: 53F5AC65-CE66-46E8-A174-F078F6F4D70F
                    Name: launch.sh
          Developer Name: (null)
                    Type: legacy daemon (0x10010)
                    Flags: [ legacy ] (0x1)
              Disposition: [enabled, allowed, notified] (0xb)
              Identifier: 16.com.zerotier.one
                      URL: file:///Library/LaunchDaemons/com.zerotier.one.plist
          Executable Path: /Library/Application Support/ZeroTier/One/launch.sh
              Generation: 1
        Parent Identifier: Unknown Developer

    #3:
                    UUID: 37FE9D4E-0726-4F9B-A4F6-A7160B9FF5F6
                    Name: php-fpm
          Developer Name: (null)
                    Type: legacy daemon (0x10010)
                    Flags: [ legacy ] (0x1)
              Disposition: [enabled, allowed, notified] (0xb)
              Identifier: 16.homebrew.mxcl.php@8.2
                      URL: file:///Library/LaunchDaemons/homebrew.mxcl.php@8.2.plist
          Executable Path: /opt/homebrew/opt/php@8.2/sbin/php-fpm
              Generation: 1
        Parent Identifier: Unknown Developer

    #4:
                    UUID: 39BEC41F-D268-4AE0-A13D-977E1036E750
                    Name: AdGuard
          Developer Name: 
          Team Identifier: TC3Q7MAJXF
                    Type: app (0x2)
                    Flags: [  ] (0)
              Disposition: [disabled, allowed, notified] (0xa)
              Identifier: 2.com.adguard.mac.adguard
                      URL: file:///Applications/Adguard.app/
              Generation: 4
        Bundle Identifier: com.adguard.mac.adguard
      Embedded Item Identifiers:
        #1: 16.com.adguard.mac.adguard.helper
    ```

[🔝](#contents)

## `dscl`

The MacOS `dscl` command allows querying and manipulation of the directory service.

You can use it to obtain usernames, UniqueIDs, Generated UniqueIDs, and more.

E.g. to get a list of all users on the system together with their UniqueIDs:

```sh
dscl . -list /Users UniqueID | sort -k 2 -n 
```

To get a list of the Generated UIDs for the users:

```sh
dscl . -list /Users GeneratedUID | sort -k 2 -n 
```

To join the two lists (hacky) :

```sh
dscl . -list /Users UniqueID | sort -k 1 -n | \
  join - <(dscl . -list /Users GeneratedUID | sort -k 1 -n )
```

The `/System/Library/CoreServices/Applications/Directory Utility.app` provides a nice GUI interface to `dscl`.

---

[🔝](#contents)

## System Extensions

( from [this gist](https://gist.github.com/nstrauss/ebca31a8110f6429ea4f2f91f4a7257b) )

[🔝](#contents)

### Where to find info and how to report on system extensions in macOS Catalina+

[🔝](#contents)

#### Staged system extensions location in folder based on unique ID

`/Library/SystemExtensions/`

[🔝](#contents)

#### Info on each

`/Library/SystemExtensions/db.plist`

- Includes...
  - state (enabled, activated, etc.)
  - associated launchd plists
  - category (network, driver, etc.)
  - original path within app bundle
  - staged path
  - version
  - identifier
  - unique ID
  - MDM enforced system extension policies via profile

[🔝](#contents)

### CLI tools

`systemextensionsctl`

- systemextensionsctl: usage:
  - `systemextensionsctl developer [on|off]`
  - `systemextensionsctl list [category]`
  - `systemextensionsctl reset`  - reset all System Extensions state
  - `systemextensionsctl uninstall <teamId> <bundleId>;` can also accept '-' for teamID

Example:

  ```sh-session
  > systemextensionsctl list
  1 extension(s)
  --- com.apple.system_extension.network_extension
  enabled active teamID bundleID (version) name [state]
  * * PXPZ95SK77 com.paloaltonetworks.GlobalProtect.client.extension (5.1.5-20/1) GlobalProtectExtension [activated enabled]

  > systemextensionsctl list com.apple.system_extension.network_extension
  Category: com.apple.system_extension.network_extension
  1 extension(s)
  --- com.apple.system_extension.network_extension
  enabled active teamID bundleID (version) name [state]
  * * PXPZ95SK77 com.paloaltonetworks.GlobalProtect.client.extension (5.1.5-20/1) GlobalProtectExtension [activated enabled]
  ```

[🔝](#contents)

## `LSSharedFileList.ApplicationRecentDocuments`

- Located at `${HOME}/Library/Application\ Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.ApplicationRecentDocuments`
- This seems to be (mostly) what gets archived by the `sfltool`
- Seems related to the items that start at Login
- File extensions are all `sfl3` and `sfl4` ; some info can be gleaned by `plutil -p`

[🔝](#contents)

## `launchctl`

The MacOS `launchctl` command allows querying and manipulation of running daemons (also known as "Launch Agents", "Services", "Helpers").

[🔝](#contents)

### Example `launchctl` commands

- Dump the full state and examine with vscode
  
    ```sh
    sudo launchctl dumpstate > /tmp/launchctlstate_system && \
      sudo chmod 644 /tmp/launchctlstate_system && \
      code /tmp/launchctlstate_system
    ```

- Show the system-level services (full)
  
    ```sh
    sudo launchctl print system
    ```
  
- Show the system-level services (summary)
  
    ```sh
    sudo launchctl list
    ```
  
- Show the user-level services (full)
  
    ```sh
    launchctl print gui/$(launchctl manageruid)
    ```

- Disable a service

    ```sh
    sudo launchctl bootout system system/com.canonical.multipassd
    ```

[🔝](#contents)

## `scutil`

The MacOS `scutil` command allows some querying and configuration of the "config store" and current system state.

It's designed to be interactive, and doesn't provide many query options as command-line arguments. So I've taken to using this (admittedly hacky) approach to "pipe" commands to `scutil`'s standard input :

  ```sh
  echo -e '
    list
    quit
  ' | sudo scutil </dev/stdin 
  ```

[🔝](#contents)

### Example `scutil` commands

- List the available keys:
  
    ```sh
    echo -e '
      list
      quit
    ' | sudo scutil </dev/stdin 
    ```
  
- Show a key's value:
  
    ```sh
    echo -e 'show <your_key_name>\nquit\n' | sudo scutil </dev/stdin 
    ```
  
- Remove a key:
  
    ```sh
    echo -e 'remove <your_key_name>\nquit\n' | sudo scutil </dev/stdin 
    ```

[🔝](#contents)

### Get all the values

> ---
>
> #### Note
>
> ---
>
> This is a hack to obtain a snapshot of all the items in the store.
> It results in each key being prefaced with an error message, because we send it the key name ***as a command*** (which we know
> it won't recognise) so that we get the key names in the output.
>
> For example, we send it BOTH of these lines as commands:
>
> ```sh
> # this will output the key 'Setup:/Network/HostNames' as part of an error message
> Setup:/Network/HostNames
> 
> # whereas the 'show' command outputs the actual value, without any context
> show Setup:/Network/HostNames
>   ```
>
> as part of the following set of input commands:
>
> ```sh
> Setup:
> show Setup:
> Setup:/
> show Setup:/
> Setup:/Network/Global/IPv4
> show Setup:/Network/Global/IPv4
> Setup:/Network/HostNames
> show Setup:/Network/HostNames
>   ```
>
> And the output is then delimited by the key names:
>
> ```plist
> Setup:: unknown, type "help" for command info
> <dictionary> {
>   CurrentSet : /Sets/4B0EE9CE-6859-41FE-96C7-F070489263D7
>   LastUpdated : 08/19/2026 11:03:24
> }
> Setup:/: unknown, type "help" for command info
> <dictionary> {
>   UserDefinedName : Automatic
> }
> Setup:/Network/Global/IPv4: unknown, type "help" for command info
> <dictionary> {
>   ServiceOrder : <array> {
>     0 : A8675551-69D5-4D9C-832A-443535F5FD70
>     1 : 60D963FE-01A2-46FF-A82A-4B064B684546
>     2 : 17DA54D9-C779-44E4-B12F-054C3BE76576
>     3 : 7604F0AB-6CDB-42E6-B10D-E64B065733AF
>   }
> }
> Setup:/Network/HostNames: unknown, type "help" for command info
> <dictionary> {
>   LocalHostName : Mikes-MacBook-Air-M1
> }
>   ```

---

[🔝](#contents)

#### `scutil` Command to Extract All Values

This command gets all the values in the config store, and will output to `stdout`.

You might want to pipe the output into vscode (e.g. by appending `| code -` ).

  ```sh
  echo -e 'list\nexit\n' | 
    sudo scutil </dev/stdin | 
    sed -E \
      -e 's/^.+= (.+)$/\1\nshow \1/' \
      -e '$ s/^(.+)$/\1\nquit\n/' | 
    sudo scutil < /dev/stdin
  ```

[🔝](#contents)
