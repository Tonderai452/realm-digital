const axios = require('axios');
const moment = require("moment");
const nodemailer = require('nodemailer');

async function run() {
    function checkIfDateIsSame(dat) {
        let birthday = moment(dat);
        let today = moment().set('year', birthday.get('year')).format("YYYY-MM-DD");

        //To test edit the date below
        //let today = moment("1963-04-07T00:00:00").set('year', birthday.get('year')).format("YYYY-MM-DD");

        if (!birthday.isSame(today)) return;
        return true;
    }

    try {
        //Get all employees from endpoint
        let getAllEmployess = await axios.get(`https://interview-assessment-1.realmdigital.co.za/employees`);

        //Get employees with birthdays
        let getEmployessNotToSendBirthdayWishes = await axios.get(`https://interview-assessment-1.realmdigital.co.za/do-not-send-birthday-wishes`);

        //Get employees with birthdays
        let getBirthdayEmployees = getAllEmployess.data.filter(employee => checkIfDateIsSame(employee?.dateOfBirth));

        if (getBirthdayEmployees.length) {
            const employeesWithBirthdays = [];
            for (const emp of getBirthdayEmployees) {
                //Check if the lastNotification date is not today
                if (emp?.lastNotification && moment(emp?.lastNotification).isSame(moment().format("YYYY-MM-DD"))) continue

                //Check if the employee no longer works for Realm Digital   
                if (emp?.employmentEndDate) continue

                //Check if the employee has not started working for Realm Digital  
                if (moment(emp?.employmentStartDate).isAfter(moment().format("YYYY-MM-DD"))) continue

                //Check if the employee has been specifically configured to not receive birthday wishes
                if (getEmployessNotToSendBirthdayWishes.data.includes(emp?.id)) continue

                emp["lastNotification"] = moment().format("YYYY-MM-DD");

                await axios({
                    method: "patch",
                    url: `https://interview-assessment-1.realmdigital.co.za/employees/${emp.id}`,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(emp)
                });

                employeesWithBirthdays.push(`${emp?.name} ${emp?.lastname}`)
            }

            //Check if employee is found
            if(employeesWithBirthdays.length){
                //Say Happy birthday to the employee
                let birthdayMessage = `Happy Birthday to ${employeesWithBirthdays.join()}`
                console.log(birthdayMessage)

                let transporter = nodemailer.createTransport({
                    host: "", //to be added
                    port: 465,
                    secure: true,
                    auth: {
                        user: "user", //to be added
                        pass: "pass", //to be added
                    }
                });

                // Send email
                await transporter.sendMail({
                    from: 'Developer <developer@realmdigital.co.za>',
                    to: 'admin@realmdigital.co.za',
                    subject: `Employee’s birthday wish`,
                    html: `<p>${birthdayMessage}</p>`
                });
            } else {
                console.log("There is no employee with birthday wish today")
            }
        } else {
            console.log("There is no employee with birthday wish today")
        }

    } catch (error) {
        console.log("Error in processing employees data: ", error.message)
    }
}
run();