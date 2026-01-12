import { LightningElement, api } from 'lwc';
import customPermissionACWTime from '@salesforce/customPermission/Show_ACW_Time';
import customPermissionHoldTime from '@salesforce/customPermission/Show_Hold_Time';

export default class AcwTimerCalculatorAssistant extends LightningElement {

    @api recordId;
    @api vendorKey;
    hasRendered = false;
    showACWTime = customPermissionACWTime;
    showHoldTime = customPermissionHoldTime;

    constructor() {
		super();
		this.telephonyEventListener = this.onVoiceEvent.bind(this);
	}

    connectedCallback(){
        this.dispatchEvent(new CustomEvent('featurepermissioncheckcomplete', {
            detail: {
                showACWTime: this.showACWTime,
                showHoldTime: this.showHoldTime
            }
        }));
    }

    renderedCallback() {
        if(!this.hasRendered) {
            this.subscribeToVoiceToolkit();
            this.hasRendered = true;
        }
    }

    onVoiceEvent(event) {
        console.log(this.vendorKey);
        if(this.vendorKey === event?.detail?.callId) {
            this.dispatchEvent(
                new CustomEvent(
                    'telephonyevent', {
                    detail : {eventType: event.type, eventData: {recordId: this.recordId, event: event.detail}}}
                )
            )
        }
    }

    subscribeToVoiceToolkit() {
        const toolkitApi = this.getToolkitApi();
		toolkitApi.addEventListener('callended', this.telephonyEventListener);
		toolkitApi.addEventListener('hold', this.telephonyEventListener);
		toolkitApi.addEventListener('resume', this.telephonyEventListener);
    }

    getToolkitApi() {
        return this.template.querySelector('lightning-service-cloud-voice-toolkit-api');
    }
}