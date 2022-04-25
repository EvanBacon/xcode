import { render } from "react-dom";

import App from "./App";
// import { PBXNativeTarget, PBXProject, XCBuildConfiguration, XcodeProject } from "./lib/types";

const rootElement = document.getElementById("root");
render(<App />, rootElement);



// const fixture: XcodeProject = require('./__tests__/fixture.json');

// const converted: any = fixture.objects[fixture.rootObject];

// // fixture.objects[converted.mainGroup]._id = converted.mainGroup;

// // converted.mainGroup = fixture.objects[converted.mainGroup];


// function expand(obj: any, key: string | number) {
//     const id = obj[key];
//     if (fixture.objects[id]) {
//         fixture.objects[id]._id = id;
//         obj[key] = fixture.objects[id];
//     }
// }

// expand(converted, 'mainGroup')
// expand(converted, 'buildConfigurationList')
// expand(converted, 'productRefGroup')
// converted.buildConfigurationList.buildConfigurations.forEach((child: any, index: number) => {
//     expand(converted.buildConfigurationList.buildConfigurations, index);
// })
// converted.productRefGroup.children.forEach((child: any, index: number) => {
//     expand(converted.productRefGroup.children, index);
// })
// converted.mainGroup.children.forEach((child: any, index: number) => {
//     expand(converted.mainGroup.children, index);
// })
// converted.targets.forEach((child: any, index: number) => {
//     expand(converted.targets, index);
// })
// converted.targets.forEach((child: any, index: number) => {

//     expand(child, 'buildConfigurationList');
//     expand(child, 'productReference');

//     child.buildConfigurationList.buildConfigurations.forEach((_child: any, index: number) => {
//         expand(child.buildConfigurationList.buildConfigurations, index);
//     })

//     child.buildPhases.forEach((_child: any, index: number) => {
//         expand(child.buildPhases, index);

//         child.buildPhases.forEach((__child: any, index: number) => {
//             if (__child.isa === 'PBXSourcesBuildPhase') {
//                 __child.files.forEach((_: any, index: number) => {
//                     expand(__child.files, index);
//                     __child.files.forEach((___child: any, index: number) => {
//                         expand(___child, 'fileRef');
//                     })
//                 })

//             }
//         })
//     })
// })

// console.log(converted);

// const mainTarget = converted.targets.find((target: PBXNativeTarget) => target.productType === 'com.apple.product-type.application');

// const debugConfig = mainTarget.buildConfigurationList.buildConfigurations.find((config: XCBuildConfiguration) => config.name === 'Debug')
// const infoPlist = debugConfig.buildSettings.INFOPLIST_FILE

// const sources = mainTarget.buildPhases.find((config: any) => config.isa === "PBXSourcesBuildPhase")

// const mainFile = sources.files[0].fileRef.path;


// console.log('main:', infoPlist, mainFile);