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
  }
  getErr(err) {
    return err.stack.split("\n").map(line =>line.trim().replace(/^at\s+/, "").replace(/\s+/g, " "))
  }
  try(src){
    this.isRun = true
    this.src = src
    this.store = void 0
    try{
      Function(src)();
    }catch(e){
      if(!this.isRun){return;}
      this.store = e
    }
    this.isRun = false
  }
  catch(){
    if(!this.store){return;}
    this.offset = 3
    return this.getErr(this.store)
      .map(line => {
        let match = line.match(/:(\d+)\)?$/);
        return match?Number(match[1])-this.offset:void 0;
      })
      .filter(n => n !== null && n >= 0);
  }
  find(num=0,ctx=1){
    if (!this.store){return;}
    let line = this.catch()[num]
    let start = Math.max(line-ctx,0)
    let end = Math.min(line+ctx+1,this.src.split("\n").length)
    let list = this.src.split("\n").slice(start,end).map(e=>"    |   | "+e)
    let errorIndex = line-start
    if (list[errorIndex]) {
      list[errorIndex]  = "    |>| "+list[errorIndex].slice(10)
    }
    return "\n"+list.join("\n")+"\n"
  }
  log(ctx,size){
    if(!this.store){api.broadcastMessage("0 Errors Found",{color:"lime"});return;}
    let e = this.store
    let str = e.name+": "+e.message+"\n"+e.stack
    this.catch().splice(0, size).forEach((e,i)=>str+="Error on Line "+e+" (<input>:"+(e+this.offset)+"): "+this.find(i,ctx))
    str+="End of Log"
    api.broadcastMessage(str,{color:"red"})
    return str
  }
}

BE = new class {
  constructor(){
    this.get = new BetterError()
  }
  try(src){this.get.try(src)}
  log(ctx=1,size = Infinity){this.get.log(ctx,size)}
  get store(){return BE.get.store}
  get src(){return BE.get.src}
}

