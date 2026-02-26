const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') && !file.includes('ThemeContext')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(directoryPath);
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Skip if it doesn't use colors
  if (!content.includes('import { colors }')) return;

  console.log(`Processing: ${file}`);
  
  // 1. Replace import
  content = content.replace(/import \{ colors \} from '.*?theme\/colors';\n?/, "import { useTheme } from '../context/ThemeContext';\n");

  // 2. We need to inject `const { colors } = useTheme();` inside the main exported function.
  // Find `export function ComponentName... {` or `export const ComponentName = ... => {`
  const funcRegex = /(export (?:default )?(?:function|const) \w+\s*=?\s*\(.*?\)(?:\s*=>)?\s*\{(?:\s*const [^;]+;)*)/;
  
  if (funcRegex.test(content)) {
     content = content.replace(funcRegex, "$1\n  const { colors } = useTheme();\n");
  } else {
     console.log(`Could not find function body for ${file}`);
  }

  // 3. Change `const styles = StyleSheet.create({` to `const getStyles = (colors: any) => StyleSheet.create({`
  content = content.replace(/const styles = StyleSheet\.create\(\{/g, "const getStyles = (colors: any) => StyleSheet.create({");

  // 4. Inject `const styles = getStyles(colors);` into the component if there is a `getStyles` but no `const styles =`.
  // Actually, wait! The functional components use `styles` constantly `style={styles.foo}`.
  // If we change it to `getStyles`, we need `const styles = getStyles(colors);` inside the component body too!
  if (content.includes('getStyles = (colors')) {
      const funcRegex2 = /(export (?:default )?(?:function|const) \w+\s*=?\s*\(.*?\)(?:\s*=>)?\s*\{(?:\s*const [^;]+;)*(?:\n\s*const \{ colors \} = useTheme\(\);))/;
      content = content.replace(funcRegex2, "$1\n  const styles = getStyles(colors);\n");
  }

  // Edge case: Sometimes people write `style={{ backgroundColor: colors.primary }}` inside the JSX without `styles`.
  // The `const { colors } = useTheme();` will fix those cases!

  fs.writeFileSync(file, content);
  modifiedCount++;
});

console.log(`Refactored ${modifiedCount} files.`);
