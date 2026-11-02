import fs from "node:fs";
import path from "node:path";

/**
 * @description XML 属性値として安全な文字列に変換する
 *              Escape a string for use as an XML attribute value
 *
 * @param  {string} value
 * @return {string}
 * @method
 * @private
 */
const escapeXmlAttribute = (value: string): string => {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

/**
 * @description テンプレートコピー後、MicrosoftGame.config の表示名をプロジェクト名にする。
 *              ID@Xbox 発行値 (TitleId / StoreId 等) はユーザーが置き換えるため変更しない。
 *              Set the display name in MicrosoftGame.config to the project name after
 *              copying a template. Values issued by ID@Xbox are left for the user.
 *
 * @param  {string} root
 * @param  {string} appName
 * @return {void}
 * @method
 * @public
 */
export const initializeXboxConfig = (root: string, appName: string): void => {
    const configPath = path.join(root, "MicrosoftGame.config");
    // Custom templates without Xbox support need no GDK configuration.
    if (!fs.existsSync(configPath)) {
        return;
    }
    const source = fs.readFileSync(configPath, "utf8");
    const updated = source.replace(
        /(<ShellVisuals\b[^>]*?\bDefaultDisplayName=")[^"]*(")/,
        (_match: string, before: string, after: string): string => `${before}${escapeXmlAttribute(appName)}${after}`
    );
    if (updated !== source) {
        fs.writeFileSync(configPath, updated);
    }
};
