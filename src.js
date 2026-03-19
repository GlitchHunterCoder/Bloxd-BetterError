Object.defineProperty(globalThis.InternalError.prototype, "name", {
  configurable: true,
  get: function() {
    if(!BE.get.isRun){return "InternalError"}
    let a = this
    this.name = "InternalError"
    BE.get.store = a
    BE.get.isRun = false
    return "InternalError"
  }
});

BetterError = class {
  constructor(){
    this.store = void 0
    this.isRun = false
    this.src = void 0
    this.offset = void 0
    this.depth = 0
  }
  getErr(err) {
    return err.stack.split("\n").map(line => line.trim().replace(/^at\s+/, "").replace(/\s+/g, " "))
  }
  try(src){
    this.isRun = true
    this.src = "//BE_START\n"+src+"\n//BE_END"
    this.store = void 0
    try{
      Function(this.src)();
    }catch(e){
      if(!this.isRun){return;}
      this.store = e
    }
    this.isRun = false
  }
  throw(){
    if(!this.store){return;}
    if(!this.store._beChain) this.store._beChain = []
    this.store._beChain.push({
      src: this.src.replace(/^\n+/,""),
      depth: this.depth,
      leading: this.src.match(/^\n*/)[0].length
    })
    throw this.store
  }
  catch(){
    if(!this.store){return [];}
    let leadingNewlines = this.src.match(/^\n*/)[0].length
    let src = this.src.replace(/^\n+/,"")
    let depth = this.depth
    let lineCount = src.split("\n").length
    let isSyntaxError = this.store instanceof SyntaxError
    this.offset = isSyntaxError ? 4 : 3 + Math.min(depth, 1)
    let seen = new Set()
    return this.getErr(this.store)
      .map(line => {
        let match = line.match(/:(\d+)\)?$/);
        return match ? Number(match[1]) - this.offset - leadingNewlines : void 0;
      })
      .filter(n => {
        if(n === null || n === undefined || n < 0 || n >= lineCount) return false
        if(seen.has(n)) return false
        seen.add(n)
        return true
      })
      .slice(0, 1)
  }
  find(num=0, ctx=1){
    if(!this.store){return "";}
    let src = this.src.replace(/^\n+/,"")
    let line = this.catch()[num]
    if(line === void 0){return "";}
    let start = Math.max(line - ctx, 0)
    let end = Math.min(line + ctx + 1, src.split("\n").length)
    let list = src.split("\n").slice(start, end).map(e => "    |   | " + e)
    let errorIndex = line - start
    if(list[errorIndex]){
      list[errorIndex] = "    |>| " + list[errorIndex].slice(10)
    }
    return "\n" + list.join("\n") + "\n"
  }
  log(ctx=1, size=Infinity){
    let logMessage;
    if(myId!=void 0){logMessage=(...args)=>api.sendMessage(myId,...args)}
    else{logMessage=(...args)=>api.broadcastMessage(...args)}
    if(!this.store){logMessage("0 Errors Found", {color:"lime"}); return;}
    let e = this.store
    let str = e.name + ": " + e.message + "\n" + e.stack
    let frames = e._beChain ? [...e._beChain] : []
    frames.push({
      src: this.src.replace(/^\n+/,""),
      depth: this.depth,
      leading: this.src.match(/^\n*/)[0].length
    })
    frames.slice(0, size).forEach((frame, fi) => {
      let lineCount = frame.src.split("\n").length
      let isSyntaxError = e instanceof SyntaxError
      let offset = isSyntaxError ? 4 : 3 + Math.min(frame.depth, 1)
      let seen = new Set()
      let lines = this.getErr(e)
        .map(line => {
          let match = line.match(/:(\d+)\)?$/);
          return match ? Number(match[1]) - offset - frame.leading : void 0;
        })
        .filter(n => {
          if(n === null || n === undefined || n < 0 || n >= lineCount) return false
          if(seen.has(n)) return false
          seen.add(n)
          return true
        })
        .slice(0, 1)
      let label = fi === 0 ? "Error" : "Rethrown"
      lines.forEach(line => {
        let start = Math.max(line - ctx, 0)
        let end = Math.min(line + ctx + 1, frame.src.split("\n").length)
        let list = frame.src.split("\n").slice(start, end).map(l => "    |   | " + l)
        let errorIndex = line - start
        if(list[errorIndex]) list[errorIndex] = "    |>| " + list[errorIndex].slice(10)
        str += label + " on Line " + line + " (<input>:" + (line + offset) + "): \n" + list.join("\n") + "\n"
      })
    })
    str += "End of Log"
    logMessage(str, {color:"red"})
    return str
  }
}

BE = new class {
  constructor(){
    this.stack = []
    this.last = new BetterError()
  }
  get get(){
    return this.stack.length
      ? this.stack[this.stack.length - 1]
      : this.last
  }
  try(src){
    let instance = new BetterError()
    instance.depth = this.stack.length
    this.stack.push(instance)
    instance.try(src)
    this.stack.pop()
    this.last = instance
  }
  log(ctx=1, size=Infinity){ this.last.log(ctx, size) }
  throw(){ this.last.throw() }
  get store(){ return this.last.store }
  get src(){ return this.last.src }
}
