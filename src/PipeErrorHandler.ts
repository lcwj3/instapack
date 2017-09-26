import * as stream from 'stream';
import glog from './GulpLog';
import * as chalk from 'chalk';
import { PrettyObject } from './PrettyObject';

let p = new PrettyObject();

/**
 * An error handler for gulp compilation using plumber plugin.
 * Outputs a colored, formatted output when possible and emits an stream end event.
 * @param this 
 * @param error 
 */
export default function PipeErrorHandler(this: stream, error) {
    try {
        console.log(p.render(error));
    } catch (ex) {
        console.log(chalk.red(error));
    }
    this.emit('end');
}