import { Vec4 } from '../../math/vec4.js';

import { LIGHTTYPE_SPOT, SHADOW_PCF3 } from '../constants.js';
import { ShadowMap } from '../renderer/shadow-map.js';

const _tempArray = [];

// A class handling runtime allocation of slots in a texture. Used to allocate slots in the shadow map,
// and will be used to allocate slots in the cookie texture atlas as well.
// Note: this will be improved in the future  to allocate different size for lights of different priority and screen size,
// and also handle persistent slots for shadows that do not need to render each frame. Also some properties will be
// exposed in some form to the user.
class LightTextureAtlas {
    constructor(device) {

        this.device = device;
        this.subdivision = 0;

        this.shadowMapResolution = 2048;
        this.shadowMap = null;

        // available slots
        this.slots = [];

        this.allocateShadowMap(1);  // placeholder as shader requires it
        this.allocateUniforms();
    }

    destroy() {
        if (this.shadowMap) {
            this.shadowMap.destroy();
            this.shadowMap = null;
        }
    }

    allocateShadowMap(resolution) {
        if (!this.shadowMap || this.shadowMap.texture.width !== resolution) {
            this.shadowMap = ShadowMap.createAtlas(this.device, resolution, SHADOW_PCF3);

            // avoid it being destroyed by lights
            this.shadowMap.cached = false;
        }
    }

    allocateUniforms() {
        this._shadowAtlasTextureId = this.device.scope.resolve("shadowAtlasTexture");
        this._shadowAtlasParamsId = this.device.scope.resolve("shadowAtlasParams");
    }

    updateUniforms() {

        // shadow atlas texture
        const isShadowFilterPcf = true;
        const shadowMap = this.shadowMap;
        const rt = shadowMap.renderTargets[0];
        const shadowBuffer = (this.device.webgl2 && isShadowFilterPcf) ? rt.depthBuffer : rt.colorBuffer;
        this._shadowAtlasTextureId.setValue(shadowBuffer);

        // shadow atlas params
        this._shadowAtlasParamsId.setValue(this.shadowMapResolution);
    }

    subdivide(numLights) {

        // required grid size
        const gridSize = Math.ceil(Math.sqrt(numLights));

        // subdivide the texture to required grid size
        if (this.subdivision !== gridSize) {
            this.subdivision = gridSize;

            this.slots.length = 0;
            const invSize = 1 / gridSize;
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    this.slots.push(new Vec4(i * invSize, j * invSize, invSize, invSize));
                }
            }
        }
    }

    // update texture atlas for a list of lights
    update(spotLights, omniLights) {

        // get all lights that need shadows
        const lights = _tempArray;
        lights.length = 0;
        for (let i = 0; i < spotLights.length; i++) {
            const light = spotLights[i];
            if (light.visibleThisFrame && light.castShadows) {
                lights.push(light);
            }
        }

        if (lights.length > 0) {
            this.allocateShadowMap(this.shadowMapResolution);
            this.subdivide(lights.length);
        }

        // leave gap between individual tiles to avoid shadow sampling other tiles (4 pixels - should be enough for PCF5)
        // note that this only fades / removes shaders on the edges, which is still not correct - a shader clipping is needed?
        const scissorOffset = 4 / this.shadowMapResolution;
        const scissorVec = new Vec4(scissorOffset, scissorOffset, -2 * scissorOffset, -2 * scissorOffset);

        // assign atlas slots to lights
        let usedCount = 0;
        for (let i = 0; i < lights.length; i++) {

            const light = lights[i];
            light._shadowMap = this.shadowMap;

            const faceCount = light.numShadowFaces;
            for (let face = 0; face < faceCount; face++) {

                const slot = this.slots[usedCount];
                usedCount++;

                // slot viewport
                const lightRenderData = light.getRenderData(null, face);
                lightRenderData.shadowViewport.copy(slot);
                lightRenderData.shadowScissor.copy(slot);

                // for spot lights in the atlas, make viewport slightly smaller to avoid sampling past the edges
                if (light._type === LIGHTTYPE_SPOT) {
                    lightRenderData.shadowViewport.add(scissorVec);
                }
            }
        }

        this.updateUniforms();
    }
}

export { LightTextureAtlas };