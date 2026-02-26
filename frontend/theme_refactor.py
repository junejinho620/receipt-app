import os
import re

directory = '/Users/junejinho/Documents/receipt-app/frontend/src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') and 'ThemeContext' not in file and 'AccountScreen' not in file:
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Check for either relative import path
            if "import { colors }" in content:
                # 1. replace imports
                content = re.sub(r"import\s*\{\s*colors\s*\}\s*from\s*['\"](?:\.\./)+theme/colors['\"];?\n?", "import { useTheme } from '../context/ThemeContext';\n", content)
                content = re.sub(r"import\s*\{\s*colors(?:.*?)\}\s*from\s*['\"](?:\.\./)+theme/colors['\"];?\n?", "import { useTheme } from '../context/ThemeContext';\n", content)
                
                # 2. find the main component and inject
                comp_name = file.replace('.tsx', '')
                pattern = re.compile(rf"(export\s+(?:default\s+)?(?:function|const)\s+{comp_name}[^\{{]*\{{\s*\n?)")
                match = pattern.search(content)
                if match:
                    inject = "  const { colors } = useTheme();\n"
                    if "StyleSheet.create({" in content:
                        inject += "  const styles = getStyles(colors);\n"
                    content = content[:match.end()] + inject + content[match.end():]
                else:
                    print(f"Failed to find component signature for {filepath}")
                
                # 3. Refactor StyleSheet.create
                content = content.replace("const styles = StyleSheet.create({", "const getStyles = (colors: any) => StyleSheet.create({")
                
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Refactored {filepath}")

