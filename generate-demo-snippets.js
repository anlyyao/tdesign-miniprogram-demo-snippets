const path = require('path');
const fs = require('fs');

// 指定组件名称
const COMPONENT_NAME = process.argv[process.argv.indexOf('--COMPONENT_NAME') + 1];

const filterFile = ['skyline']; // 需要过滤的示例文件夹内
const saveFileType = ['js', 'json', 'wxml', 'wxss']; // 需要保存的文件类型
const specialFileContent = [
  {
    file: 'app.json',
    oldContent: 'pages/button/button',
    newContent: 'pages/' + COMPONENT_NAME + '/' + COMPONENT_NAME,
  },
  {
    file: 'project.private.config.json',
    oldContent: 'tdesign-button-demo',
    newContent: 'tdesign-' + COMPONENT_NAME + '-demo',
  },
  {
    file: 'package.json',
    oldContent: 'tdesign-button-demo',
    newContent: 'tdesign-' + COMPONENT_NAME + '-demo',
  },
  {
    file: 'package-lock.json',
    oldContent: 'tdesign-button-demo',
    newContent: 'tdesign-' + COMPONENT_NAME + '-demo',
  },
];

const deleteKeyContent = [
  {
    file: `pages/${COMPONENT_NAME}/${COMPONENT_NAME}.json`,
    keys: ['navigationBarBackgroundColor'],
  },
];

const deleteNavbarContent = [{ file: `pages/${COMPONENT_NAME}/${COMPONENT_NAME}.wxml` }];

const copyFiles = (fromPath, toPath) => {
  // fs.cp() 异步拷贝
  fs.cp(fromPath, toPath, { recursive: true }, (err) => {
    if (err) {
      console.log(err);
    }
  });
};

const removeFile = (targetPath, filterFile, saveFileType) => {
  fs.readdir(targetPath, (err, files) => {
    if (err) {
      console.error('Error reading source directory:', err);
      return;
    }
    files.forEach((file) => {
      if (fs.lstatSync(path.join(targetPath, file)).isDirectory()) {
        // 处理目录
        if (filterFile.includes(file)) {
          // 如果是过滤的目录，则直接删除
          fs.rmSync(path.join(targetPath, file), { recursive: true });
        }
      } else {
        // 处理文件
        if (!saveFileType.includes(file.slice(file.indexOf('.') + 1))) {
          // 如果是过滤的文件，则直接删除
          fs.unlink(path.join(targetPath, file), (err) => {
            if (err) {
              console.error('删除文件时出错:', err);
              return;
            }
            console.log('文件已成功删除', path.join(targetPath, file));
          });
        }
      }
    });
  });
};

const replaceContent = (targetPath) => {
  specialFileContent.forEach((item) => {
    fs.readFile(path.join(targetPath, item.file), 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading source directory:', err);
        return;
      }
      const result = data.replaceAll(item.oldContent, item.newContent);
      fs.writeFile(path.join(targetPath, item.file), result, 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
          return;
        }
        console.log('文件已成功保存');
      });
    });
  });
};

const deleteContentByKey = (targetPath) => {
  deleteKeyContent.forEach((item) => {
    const jsonData = fs.readFileSync(path.join(targetPath, item.file), 'utf8');
    const data = JSON.parse(jsonData);
    item.keys.forEach((key) => {
      delete data[key];
    });
    const newData = JSON.stringify(data, null, 2);
    fs.writeFileSync(path.join(targetPath, item.file), newData, 'utf8');
  });
};

const deleteContentNavbar = (targetPath) => {
  deleteNavbarContent.forEach((item) => {
    const fileContent = fs.readFileSync(path.join(targetPath, item.file), 'utf8');
    // 使用正则表达式匹配以 <t-navbar 开头并以 /> 结尾的内容
    const regex = /<t-navbar[^>]*?\/>/g;
    // 使用 replace() 方法替换匹配到的内容
    const updatedContent = fileContent.replace(regex, '');

    fs.writeFileSync(path.join(targetPath, item.file), updatedContent, 'utf8');
  });
};

const generateDemoSnippets = async (componentName) => {
  const baseDemoPath = path.resolve(__dirname, './_base_sinppets');
  const _snippetsTargetPath = path.resolve(__dirname, './_snippets/');
  const _snippetsOriginPath = path.join(
    path.resolve(__dirname, './tdesign-miniprogram/_example/pages'),
    componentName
  );

  if (!fs.existsSync(_snippetsOriginPath)) {
    console.log('baseDemoPath is not exist');
    return;
  }

  const targetPath = path.join(_snippetsTargetPath, 'tdesign-' + componentName + '-demo');

  // 1. 复制基础片段到指定文件
  await copyFiles(baseDemoPath, targetPath);
  // 2. 复制 _snippetsOriginPath 下的示例代码到 targetPath
  const cpDemoCodePath = path.join(targetPath, 'pages/' + componentName);
  await copyFiles(_snippetsOriginPath, cpDemoCodePath);

  setTimeout(async () => {
    // 3. 检查片段内容
    await removeFile(cpDemoCodePath, filterFile, saveFileType);
    await replaceContent(targetPath, componentName);
    await deleteContentByKey(targetPath);
    await deleteContentNavbar(targetPath);
  }, 300);
};

/**
 * @description 命令行执行 node generate-demo-snippets.js -- --COMPONENT_NAME action-sheet
 */
generateDemoSnippets(COMPONENT_NAME);
