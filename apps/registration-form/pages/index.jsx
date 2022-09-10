import { Button } from "ui";
import { useForm } from 'react-hook-form';

import supabase from "../lib/supabase";

function GetAge(birthDate) {
  console.log(birthDate)
  var today = new Date();
  var age = today.getFullYear() - birthDate.getUTCFullYear();
  console.log(today.getFullYear(), birthDate.getUTCFullYear())
  var m = today.getMonth() - birthDate.getUTCMonth();
  console.log(today.getMonth(), birthDate.getUTCMonth())
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getUTCDate())) {
    age--;
  }
  console.log(today.getDate(), birthDate.getUTCDate())
  return age;
}

export default function Docs() {
  
  const {
    register,
    handleSubmit,
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    console.log(data)
    const age = GetAge(new Date(data.date_of_birth));
    console.log(age)
    await supabase
      .from('registered-users')
      .insert([{
        ...data,
        age,
      }]);

    reset();
  };

  return (
    <form
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
      onSubmit={handleSubmit(onSubmit)}
      onReset={reset}
    >
      <label htmlFor="email">Email*</label>
      <input {...register("email", { required: true })} type="email" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <label htmlFor="first_name">First Name*</label>
          <input {...register("first_name", { required: true })} type="text" />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <label htmlFor="last_name">Last Name*</label>
          <input {...register("last_name", { required: true })} type="text" />
        </div>
      </div>
      <label htmlFor="date_of_birth">Date of Birth*</label>
      <input {...register("date_of_birth", { required: true })} type="date" />

      <Button type="submit">
        Submit
      </Button>
    </form>
  );
}
