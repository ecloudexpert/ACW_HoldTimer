public with sharing class ACWApexController {
    @AuraEnabled
    public static SObject getVoiceCall(String callId){
        String qu = '';
        qu = 'SELECT Id, After_Call_Work_Duration__c, VendorCallKey, CallDisposition FROM VoiceCall WHERE Id =\'' + String.escapeSingleQuotes(callId) + '\'';
        return Database.query(qu);
    }
    
    @AuraEnabled
    public static String setVoiceCall(SObject voiceCall){
        try{
            String sobjectName = String.valueOf(voiceCall.getSObjectType());
            if(Schema.getGlobalDescribe().get(sobjectName).getDescribe().isUpdateable()){
                update voiceCall;
                return 'SUCCESS';
            }
            return '';
        }
        catch(Exception ex){
            return ex.getMessage();
        }
    }
}