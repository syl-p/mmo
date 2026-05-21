import {Pane} from 'tweakpane'

export default class Debug {
    active = false
    ui = new Pane({disabled: true})

    constructor() {
        this.active = window.location.hash === '#debug'

        if(this.active) {
          this.ui.disabled = false
        }
    }
}
