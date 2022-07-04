import chalk from 'chalk';


export function successfulReplaceResponse(successfulReplace: boolean, elementName: string, elementType: string): string {
    if (successfulReplace) {
    // Output message saying project is ready
        return (chalk.blue(`File ${elementName} is ready!`))
    } else {
        return (chalk.red(`There was a issue in making your ${elementType} file!`))
    }
}
