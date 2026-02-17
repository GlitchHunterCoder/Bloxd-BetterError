Object.defineProperty(globalThis.InternalError.prototype, "name", {
  configurable: true,
  get: function() {
    if(!BetterError.isRun){return "InternalError"}
    let a = this
    this.name = "InternalError"
    BetterError.store = a
    BetterError.isRun = false
    return "InternalError"
  }
});

BetterError = class {
  constructor(){
    this.store = void 0
    this.isRun = false
    this.src = void 0
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
    return this.getErr(this.store).map(e=>+e.replace(/\D+/g, '')-3+(this.store.name=="InternalError")).filter(e=>e>=0)
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
  log(){
    if(!this.store){return;}
    let e = this.store
    let str = e.name+": "+e.message+"\n"+e.stack
    this.catch().forEach((e,i)=>str+="Error on Line "+e+" (<input>:"+(e+3)+"): "+this.find(i))
    str+="End of Log"
    api.broadcastMessage(str,{color:"red"})
    return str
  }
}

BE = new class {
  constructor(){
    this.E = new BetterError()
  }
  try(src){this.E.try(src)}
  log(){this.E.log()}
}
