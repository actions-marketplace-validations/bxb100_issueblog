import * as core from '@actions/core'
import {getConfig} from "./config";
import {exec} from "@actions/exec";
import {IssuesUtil} from "./util/issue";
import {add_md_friends} from "./util/friend-process";
import * as fs from "fs";
import {diff, getModifiedUnstagedFiles, getUnstagedFiles} from "./util/git";

async function run(): Promise<void> {
    core.info('[INFO] see https://github.com/bxb100/gitlog')

    // 1. 配置 git 和 action input 信息
    core.startGroup("Configuration")
    const config = getConfig()
    // is anyway to set other bot?
    const username = 'github-actions[bot]'
    await exec('git', ['config', 'user.name', username])
    await exec('git', [
        'config',
        'user.email',
        'github-actions[bot]@users.noreply.github.com'
    ])
    core.endGroup()

    // 2. 处理 issues
    core.startGroup('Process issues')
    const issuesUtil = new IssuesUtil(config.github_token)
    let text = config.md_header
    text = await issuesUtil.processIssues(1, text, add_md_friends)
    core.endGroup()

    // 3. 写入到 README.md
    core.startGroup('Write to README.md')
    fs.writeFileSync('README.md', text)
    core.endGroup()

    // 4. 暂存需要提交的文件
    core.startGroup("File change")
    const newUnstagedFiles = await getUnstagedFiles()
    const modifiedUnstagedFiles = await getModifiedUnstagedFiles()
    const editedFilenames = [...newUnstagedFiles, ...modifiedUnstagedFiles]
    core.info(`newUnstagedFiles: \n${newUnstagedFiles}`)
    core.info(`modifiedUnstagedFiles: \n${modifiedUnstagedFiles}`)
    core.info(`editedFilenames: \n${editedFilenames}`)
    core.endGroup()

    // 5. 计算是否有修改
    core.startGroup('Calculating diff')
    const editedFiles = []
    for (const filename of editedFilenames) {
        core.debug(`git adding ${filename}…`)
        await exec('git', ['add', filename])
        const bytes = await diff(filename)

        editedFiles.push({name: filename, deltaBytes: bytes})
    }
    core.endGroup()

    // 6. POST 提交
    core.startGroup('Committing new data')
    const alreadyEditedFiles = JSON.parse(process.env.FILES || '[]')
    const files = [...alreadyEditedFiles, ...editedFiles]

    core.info(`alreadyEditedFiles: \n${JSON.stringify(alreadyEditedFiles)}`)
    core.info(`editedFiles: \n${JSON.stringify(editedFiles)}`)
    core.exportVariable('FILES', files)
    core.endGroup()
}

run().catch(error => {
    core.setFailed('Workflow failed! ' + error.message)
})