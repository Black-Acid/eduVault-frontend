"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { FieldError } from "~/components/ui/field";
// import { Spinner } from "~/components/ui/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "~/components/ui/toast";
import z from "zod/v3";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Schema for form validation using Zod
const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  name: z.string().min(2, { message: "Name is required" }),
  role: z.string().min(1, { message: "Role is required" }),
});

const roles = ["Student", "Tutor"];

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const form = useForm<z.infer<typeof formSchema>>({
    // Initialize the form using react-hook-form with Zod resolver
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "",
    },
  });

  // Initialize the Next.js router for navigation after successful login
  const router = useRouter();

  // Loading state for the form submission
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Form values destructor
    const { email, password, name, role } = data;

    // Sign in form api request
    const lower_case_role = role.toLowerCase();
    try {
      const response = await fetch("/api/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, role: lower_case_role }),
      });

      const data = await response.json();

      // Handle the success response from the API
      if (response.ok) {
        form.reset();
        toast.add({
          description: "Account created successfully!",
          type: "success",
        });
        setIsLoading(false);
        return router.push("/");
      }

      // Handle the error response from the API
      else {
        setIsLoading(false);
        return toast.add({
          description: data.error || "Error creating an account",
          type: "error",
        });
      }
    } catch {
      // Handle any unexpected errors during the fetch operation
      setIsLoading(false);
      toast.add({
        description: "An error occurred while creating the account",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Signup to your account</CardTitle>
          <CardDescription>
            Enter your details below to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Full Name</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter your full name"
                      autoComplete="off"
                      required
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter your email"
                      autoComplete="off"
                      required
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Password</FieldLabel>
                    <Input
                      type="password"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      placeholder="••••••••••"
                      autoComplete="off"
                      required
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="col-span-full"
                  >
                    <FieldLabel>Role</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectGroup>
                          {roles.map((role) => (
                            <SelectItem key={role} value={String(role)}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading === true}
                >
                  {isLoading ? "Loading" : "Sign Up"}
                </Button>

                <FieldDescription className="text-center">
                  Already have an account? <Link href="/login">Login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
