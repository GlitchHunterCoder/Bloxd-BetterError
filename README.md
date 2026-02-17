# Bloxd-BetterError
## Tools
This tool is relatively simple, but its use is this
- To make error finding in bloxd faster than ever before

This is achieved through its 2 functions
- `BE.try(src)` Takes in code as a string, and executes it, finding any errors along the way
- `BE.log(ctx=1,size=Infinity)` Which will log all the errors it found, and where it happened

You can also use
- `BE.store` to get the stored error directly if you want to inspect yourself
- `BE.src` to get your own code back if needed

It can be used to detect all normal code errors AND it can detect, (but not prevent) interruption errors as well

Below is Example of how its used
## Usage
you input your code into a `BE.try(src)` as a string, into a code block, after the rest is loaded

in this example i got the code below
```js
BE.try(`function level1() {
  level2()
}

function level2() {
  level3()
}

function level3() {
  let x = undefined
  x.y.z
}

level1()`)

BE.log(2)
```
and after i click it i will get this result back
```diff
TypeError: cannot read property 'y' of undefined
  at level3 (<input>:13)
  at level2 (<input>:8)
  at level1 (<input>:4)
  at anonymous (<input>:16)
  at try
  at try
  at <eval>
Error on Line 10 (<input>:13): 
  |  | function level3() {
  |  |  let x = undefined
  | >|  x.y.z
  |  | }
  |  | 
Error on Line 5 (<input>:8): 
  |  | 
  |  | function level2() {
  | >|  level3()
  |  | }
  |  | 
Error on Line 1 (<input>:4): 
  |  | function level1() {
  | >|  level2()
  |  | }
  |  | 
Error on Line 13 (<input>:16): 
  |  | }
  |  | 
  | >| level1()
End of Log
```
which clearly shows exactly where the error is, and how it propagates through the code
