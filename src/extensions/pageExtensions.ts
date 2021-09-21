// Copyright (c) Microsoft Corporation.// Licensed under the MIT license.

import { HttpPostMessage, IHttpPostMessageResponse } from 'http-post-message';
import { Page, VisualDescriptor } from 'powerbi-client';
import {
    ICreateVisualRequest,
    ICreateVisualResponse,
    IVisual,
    IVisualLayout
} from 'powerbi-models';

import { Errors } from '../errors';
import { IVisualResponse } from '../models';
import { IPowerBIClientExtension } from './powerBIClientExtension';

/**
 * @hidden
 * @export
 * @class PageExtensions
 * @implements {IPowerBIClientExtension}
 */
export class PageExtensions implements IPowerBIClientExtension {

    /**
     * @hidden
     */
    private static post<T>(page: Page, url: string, body: any): Promise<T> {
        const hpm = PageExtensions.hpm(page);
        const uid = PageExtensions.uid(page);
        const contentWindow = PageExtensions.contentWindow(page);

        return hpm.post<T>(url, body, { uid }, contentWindow)
            .then( (response) => {
                return response.body;
            },
            (response) => {
                throw response.body;
            });
    }

    /**
     * @hidden
     */
    private static contentWindow(page: Page): Window {
        return page.report.iframe.contentWindow;
    }

    /**
     * @hidden
     */
    private static uid(page: Page): string {
        return page.report.config.uniqueId;
    }

    /**
     * @hidden
     */
    private static hpm(page: Page): HttpPostMessage {
        return page.report.service.hpm;
    }

    /**
     * @hidden
     */
    initialize(): void {
        if (Page == null) {
            console.error(Errors.PowerBIClientIsNotInitialized);
            return;
        }

        Page.prototype.createVisual = function(this: Page, visualType: string, layout?: IVisualLayout, autoFocus?: boolean): Promise<IVisualResponse> {
            const createVisualRequest: ICreateVisualRequest = { visualType, layout, autoFocus};
            return PageExtensions.post<ICreateVisualResponse>(this, `/report/pages/${this.name}/createVisual`, createVisualRequest)
                .then((responseBody) => {
                    const visual: IVisual = responseBody.visual;
                    const visualResponse: IVisualResponse = {
                        visual: new VisualDescriptor(this, visual.name, visual.title, visual.type, visual.layout)
                    };
                    return visualResponse;
                },
                (responseBody) => {
                    throw responseBody;
                });
        };

        Page.prototype.deleteVisual = function(this: Page, visualName: string): Promise<void> {
            return PageExtensions.post<void>(this, `/report/pages/${this.name}/deleteVisual`, { visualName });
        };
    }
}
