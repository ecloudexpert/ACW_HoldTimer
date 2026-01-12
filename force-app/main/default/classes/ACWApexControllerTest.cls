@isTest
public class ACWApexControllerTest {
    
    //create VoiceCall
    @testSetup
    static void setupTestData() {
        String uniqueUserName = 'standarduser' + DateTime.now().getTime() + '@testorg.com';
        // This code runs as the system user
        Profile p = [SELECT Id FROM Profile WHERE Name='System Administrator'];
        User testUser = new User(Alias = 'standt', Email='standarduser@testorg.com',
                                 EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US',
                                 LocaleSidKey='en_US', ProfileId = p.Id,
                                 TimeZoneSidKey='America/Los_Angeles',
                                 UserName=uniqueUserName);
        insert testUser;
        List<PermissionSet> psList = [SELECT Id 
                            FROM PermissionSet 
                            WHERE (Name Like '%PartnerTelephony%' OR Name Like 'ServiceCloudVoice%' OR Name Like '%ContactCenterA%')];
        insert new PermissionSetAssignment(AssigneeId = testUser.Id, PermissionSetId = psList[0].Id);
        
        VoiceCall testVoiceCall = new VoiceCall(
            CallDisposition  = 'Completed',
            VendorType = 'ContactCenter',
            CallStartDateTime = System.Today(),
            CallEndDateTime = System.Today(),
            FromPhoneNumber = '+919003778743',
            ToPhoneNumber = '+919003778743',
            CallType = 'Inbound',
            OwnerID = UserInfo.getUserId()
        );
        System.runAs(testUser){
            insert testVoiceCall;
        }
    }
    // Test the case when setVoiceCall success
    @isTest
    static void testSetVoiceCallSuccess() {
        //Get VoiceCall
        VoiceCall testVoice = [Select Id  FROM VoiceCall LIMIT 1];
        
        Test.startTest();
        //pass the VoiceCall
        String result = ACWApexController.setVoiceCall(testVoice);
        
        Test.stopTest();
       
        // Assertions
        System.assertEquals('SUCCESS', result, 'The response should not be SUCCESS for a non-VoiceCall object');
    }
    
        // Test the case when setVoiceCall fails
    @isTest
    static void testSetVoiceCallFailure() {
        // Create an Account instead of a VoiceCall to trigger failure
        VoiceCall testVoice = [Select Id  FROM VoiceCall LIMIT 1];
        VoiceCall sfobject = new VoiceCall();
        Test.startTest();
        
        // Call setVoiceCall method with an incorrect object type
        sfobject = (VoiceCall)ACWApexController.getVoiceCall(testVoice.Id);
        System.assertEquals(testVoice.Id, sfobject.Id);
        Test.stopTest();
    }
}