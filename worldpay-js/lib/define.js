/*
This is included so the build script can insert it before any
third party libraries in the output.

It is required to prevent third party libraries from defining an
AMD module which interferes with our own AMD module definition.
*/
var define;