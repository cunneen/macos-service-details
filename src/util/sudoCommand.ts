import { exec as sudo } from "@vscode/sudo-prompt";

export type SudoCommandParams = {
  /**
   * The command to run as sudo e.g. "whoami"
   */
  command: string;
  /**
   * The dialog title e.g. "Auth required"
   */
  name: string;
  /**
   * (Optional) a path to an icns file to display in the dialog
   *
   * @example
   * "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertNoteIcon.icns"
   */
  icns?: string;
};

/**
 * Runs a shell command with administrator privileges.
 *
 * Prompts the user for authentication via the native macOS authorization dialog
 * before executing the given command. Resolves with the command's stdout on
 * success, or rejects with the underlying error if the command fails or is
 * cancelled by the user.
 *
 * @param params - {@link SudoCommandParams} describing the command to run, the
 * dialog title, and an optional icon.
 * @returns A promise that resolves to the command's standard output.
 * @throws Rejects with the error returned by the underlying sudo-prompt process.
 *
 * @example
 * ```ts
 * const output = await sudoCommand({
 *   command: "whoami",
 *   name: "Auth required",
 *   icns: "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertNoteIcon.icns",
 * });
 * console.log(output);
 * ```
 */
export const sudoCommand = async (
  params: SudoCommandParams,
): Promise<string | Buffer<ArrayBufferLike> | undefined> => {
  const { command, ...options } = params;

  return new Promise((resolve, reject) => {
    sudo(command, options, (error, stdout, _stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
};
